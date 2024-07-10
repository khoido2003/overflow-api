import express from "express";
import { db } from "../lib/db";
import {
  AskQuestionValidator,
  BookmarkQuestionValidator,
  UpvoteDownvoteQuestionValidator,
} from "../lib/validators/question";
import HTTP_STATUS_CODES from "../constants/status-code";
import { GetQuestionsQuery, RecommendedParams } from "types/shared";
import { Prisma, User } from "@prisma/client";
import { user } from "routers/user";

// Create new question
export const createQuestion = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { content, tags, title, author } = AskQuestionValidator.parse(req.body);

  try {
    //Only use transaction in complex write database
    // Start a transaction - ensure database integrity
    const result = await db.$transaction(async (tx) => {
      // Create new question
      const newQuestion = await tx.question.create({
        data: {
          content,
          title,
          authorId: author,
        },
      });

      // Find or create tags and associate them with the question
      const tagIds = await Promise.all(
        tags.map(async (tag) => {
          const existingTag = await tx.tag.findFirst({
            where: {
              name: {
                equals: tag,
                mode: "insensitive",
              },
            },
          });

          if (existingTag) {
            return existingTag.id;
          }

          const newTag = await tx.tag.create({
            data: {
              name: tag,
            },
          });

          return newTag.id;
        })
      );

      // Create tag associations in bulk
      const tagAssociations = tagIds.map((tagId) => ({
        questionId: newQuestion.id,
        tagId,
      }));

      await tx.tagOnQuestion.createMany({
        data: tagAssociations,
      });

      // Create an interaction record for recommendation filter when get all questions

      const newInteraction = await tx.interaction.create({
        data: {
          action: "question_created", // Assuming this is a string type
          user: { connect: { id: author } },
          question: { connect: { id: newQuestion.id } },
        },
      });

      const tagInteractions = tagIds.map((tagId) => ({
        interactionId: newInteraction.id,
        tagId,
      }));

      await tx.tagInteraction.createMany({
        data: tagInteractions,
      });

      // Add +5 points to user's reputation
      await tx.user.update({
        where: {
          id: author,
        },
        data: {
          reputation: {
            increment: 5,
          },
        },
      });

      return newQuestion;
    });

    return res.status(HTTP_STATUS_CODES.CREATED).json({
      message: "success",
      data: result,
    });
  } catch (error) {
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

//////////////////////////////////////////////////////////////

// Get all questions by pagination
export const getQuestions = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const {
      filter,
      page = 1,
      pageSize = 10,
      searchQuery,
    } = req.query as GetQuestionsQuery;

    const skipAmount = (page - 1) * pageSize;

    let sortOption = {};

    switch (filter) {
      case "newest":
        sortOption = { createdAt: "desc" };
        break;
      case "frequent":
        sortOption = { views: "desc" };
        break;
      case "unanswered":
        sortOption = {
          userAnswers: {
            _count: "asc",
          },
        };
        break;
      default:
        break;
    }

    let searchOption = {};

    if (searchQuery) {
      searchOption = {
        OR: [
          {
            title: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
          {
            content: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    // Refactor to promise all to execute 2 query at the same time
    const [questionsCount, questions] = await Promise.all([
      db.question.count({
        where: searchOption,
      }),
      db.question.findMany({
        where: searchOption,

        select: {
          id: true,
          title: true,
          views: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          tagOnQuestion: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          userUpvotes: {
            select: {
              id: true,
            },
          },
          userAnswers: {
            select: {
              id: true,
            },
          },
        },
        skip: skipAmount,
        take: +pageSize,
        orderBy: sortOption,
      }),
    ]);

    return res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: questions,
      results: questionsCount,
    });
  } catch (error) {
    console.log(error);
    next({ error: error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

////////////////////////////////////////

// Get question by ID
export const getQuestionByID = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params;

    // Retrieve the question with specific fields
    const question = await db.question.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        views: true,
        createdAt: true,
        authorId: true,

        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        userUpvotes: {
          select: {
            id: true,
            userId: true,
          },
        },
        userDownvotes: {
          select: {
            id: true,
            userId: true,
          },
        },
        userSavedQuestion: {
          select: {
            userId: true,
          },
        },
        userAnswers: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            questionDownvotes: {
              select: {
                id: true,
              },
            },
            questionUpvotes: {
              select: {
                id: true,
              },
            },
          },
        },
        tagOnQuestion: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return next({
        error: "Question not found",
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    // Send the response with the optimized data
    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: question,
    });
  } catch (error) {
    console.log(error);
    next({ error: error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

//////////////////////////////////////////////

// Upvotes / Downvotesa question

// Upvote a question
export const upvoteQuestion = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { questionId, userId } = UpvoteDownvoteQuestionValidator.parse(
      req.body
    );

    await db.$transaction(async (tx) => {
      // Check if the user has already upvoted the question
      const existingUpvote = await tx.userUpvotesQuestion.findFirst({
        where: { questionId, userId },
      });

      if (existingUpvote) {
        // If the user has already upvoted, remove the upvote
        await tx.userUpvotesQuestion.delete({
          where: { id: existingUpvote.id },
        });
      } else {
        // Check if the user has downvoted the question
        const existingDownvote = await tx.userDownVoteQuestion.findFirst({
          where: { questionId, userId },
        });

        if (existingDownvote) {
          // If the user has downvoted, remove the downvote
          await tx.userDownVoteQuestion.delete({
            where: { id: existingDownvote.id },
          });
        }

        // Add the upvote
        await tx.userUpvotesQuestion.create({
          data: { questionId, userId },
        });
      }
    });

    res
      .status(HTTP_STATUS_CODES.OK)
      .json({ message: "Upvote toggled successfully" });
  } catch (error) {
    console.log(error);
    next({ error: error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

//////////////////////////////////////////////////////////////

// Downvote a question
export const downvoteQuestion = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { questionId, userId } = UpvoteDownvoteQuestionValidator.parse(
      req.body
    );

    await db.$transaction(async (tx) => {
      // Check if the user has already downvoted the question
      const existingDownvote = await tx.userDownVoteQuestion.findFirst({
        where: { questionId, userId },
      });

      if (existingDownvote) {
        // If the user has already downvoted, remove the downvote
        await tx.userDownVoteQuestion.delete({
          where: { id: existingDownvote.id },
        });
      } else {
        // Check if the user has upvoted the question
        const existingUpvote = await tx.userUpvotesQuestion.findFirst({
          where: { questionId, userId },
        });

        if (existingUpvote) {
          // If the user has upvoted, remove the upvote
          await tx.userUpvotesQuestion.delete({
            where: { id: existingUpvote.id },
          });
        }

        // Add the downvote
        await tx.userDownVoteQuestion.create({
          data: { questionId, userId },
        });
      }
    });

    res
      .status(HTTP_STATUS_CODES.OK)
      .json({ message: "Downvote toggled successfully" });
  } catch (error) {
    console.log(error);
    next({ error: error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

///////////////////////////////////////

// Update views of the questions
export const updateQuestionView = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params;

    const answer = await db.question.update({
      where: {
        id,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "success",
    });
  } catch (error) {
    console.log(error);
    next({
      error: error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

////////////////////////////////////////////

// Get top 5 most viewed and upvoted questions
export const getTop5Questions = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const questions = await db.question.findMany({
      select: {
        id: true,
        title: true,
        views: true,
        _count: {
          select: {
            userUpvotes: true,
          },
        },
      },
      take: 5,
      orderBy: [
        {
          views: "desc",
        },
        {
          userUpvotes: {
            _count: "desc",
          },
        },
      ],
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: questions,
    });
  } catch (error) {
    console.log(error);
    next({
      error: error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

///////////////////////////////////////////////

// bookmark/unbookmark a question
export const boormarkQuestionFn = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { questionId, userId } = BookmarkQuestionValidator.parse(req.body);

    await db.$transaction(async (tx) => {
      const bookmarkQuestion = await tx.userSavedQuestion.findFirst({
        where: { questionId, userId },
      });

      if (bookmarkQuestion) {
        // If user already bookmark this question then unbookmark it
        await tx.userSavedQuestion.delete({
          where: {
            id: bookmarkQuestion.id,
          },
        });
      } else {
        await tx.userSavedQuestion.create({
          data: {
            questionId,
            userId,
          },
        });
      }
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
    });
  } catch (error) {
    console.log(error);

    next({
      error: error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

////////////////////////////////////////////////////////////

// Find bookmarked Questions
export const findBookmarkedQuestions = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Take out the information of the current login user
  // @ts-ignore
  const currentUser = req.user as User;

  try {
    const {
      filter,
      page = 1,
      pageSize = 5,
      searchQuery,
    } = req.query as GetQuestionsQuery;

    const skipAmount = (page - 1) * pageSize;

    // Order of the questions
    let sortOption = {};

    // For search questions
    let searchOption = {};

    switch (filter) {
      case "newest":
        sortOption = {
          dateAdded: "asc",
        };
        break;
      case "oldest":
        sortOption = {
          dateAdded: "desc",
        };

      default:
        break;
    }

    if (searchQuery) {
      searchOption = {
        userId: currentUser.id,
        OR: [
          {
            question: {
              content: {
                contains: searchQuery,
                mode: "insensitive",
              },
              title: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          },
        ],
      };
    } else {
      searchOption = {
        userId: currentUser.id,
      };
    }

    const bookmarkedQuestions = await db.userSavedQuestion.findMany({
      where: searchOption,

      select: {
        question: {
          select: {
            id: true,
            author: {
              select: {
                name: true,
                image: true,
                id: true,
              },
            },
            _count: {
              select: {
                userUpvotes: true,
                userAnswers: true,
              },
            },
            tagOnQuestion: {
              select: {
                tag: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },

            createdAt: true,
            title: true,
            views: true,
          },
        },
      },

      skip: skipAmount,
      take: +pageSize,
      orderBy: sortOption,
    });

    const questionsCount = await db.userSavedQuestion.count({
      where: searchOption,
    });

    return res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: bookmarkedQuestions,
      results: questionsCount,
    });
  } catch (error) {
    console.log(error);

    next({
      error: error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

//////////////////////////////////////////////////////////

// Get recommendation questions for each user based on interaction with tags
export const getRecommendedQuestions = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      searchQuery,
    } = req.query as RecommendedParams;

    //@ts-ignore
    const currentUser = req.user as User;
    console.log(currentUser);

    // Paginate
    const skipAmount = (page - 1) * pageSize;

    // Find all the tags that user has interacted with
    const userInteractions = await db.interaction.findMany({
      where: { userId: currentUser.id },
      select: {
        TagInteractions: {
          select: {
            tagId: true,
          },
        },
      },
    });

    // Extract tags from user's interaction
    const userTags = userInteractions.reduce((tags, interaction) => {
      if (interaction.TagInteractions.length > 0) {
        tags = tags.concat(
          interaction.TagInteractions.map(
            (tagInteraction) => tagInteraction.tagId
          )
        );
      }
      return tags;
    }, [] as string[]);

    // Get distinct tag IDs from user's interaction
    const distincUserTagIDs = Array.from(new Set(userTags));

    // Base query for questions
    let query: Prisma.QuestionWhereInput = {
      AND: [
        {
          authorId: {
            // Exclude user's own questions
            not: currentUser.id,
          },
        },
      ],
    };

    // If the user has interacted with tags
    if (distincUserTagIDs.length > 0) {
      query = {
        tagOnQuestion: {
          some: {
            tagId: {
              in: distincUserTagIDs,
            },
          },
        },
      };
    }

    // Add search query if provided
    if (searchQuery) {
      query = {
        ...query,
        OR: [
          {
            title: {
              contains: searchQuery,
              mode: "insensitive",
            },
            content: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    // If no interactions or search query, use fallback to show trending or recent questions
    if (distincUserTagIDs.length === 0 && !searchQuery) {
      query = {
        ...query,
        OR: [
          {
            views: { gte: 100 },
            createdAt: {
              // Show questions added in the last week
              gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            },
          },
        ],
      };
    }

    // Execute the both query at the same time to find the number of the total results and the result list
    const [totalQuestions, recommendedQuestions] = await Promise.all([
      db.question.count({ where: query }),
      db.question.findMany({
        where: query,
        select: {
          id: true,
          title: true,
          views: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          tagOnQuestion: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          userUpvotes: {
            select: {
              id: true,
            },
          },
          userAnswers: {
            select: {
              id: true,
            },
          },
        },
        skip: skipAmount,
        take: +pageSize,
      }),
    ]);

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      results: totalQuestions,
      data: recommendedQuestions,
    });
  } catch (error) {
    console.log(error);
    next({ error: error, statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR });
  }
};
