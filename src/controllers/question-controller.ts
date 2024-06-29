import express from "express";
import { db } from "../lib/db";
import { AskQuestionValidator } from "../lib/validators/question";
import HTTP_STATUS_CODES from "../constants/status-code";
import { GetQuestionsQuery } from "types/shared";

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

    return res.status(HTTP_STATUS_CODES.OK).json({
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
        sortOption = { viewCount: "desc" };
        break;
      case "unanswered":
        sortOption = { answerCount: "asc" };
        break;
      default:
        break;
    }

    const questions = await db.question.findMany({
      where: searchQuery
        ? {
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
          }
        : {},

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
      take: pageSize,
      orderBy: sortOption,
    });

    return res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: questions,
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
          },
        },
        userDownvotes: {
          select: {
            id: true,
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
