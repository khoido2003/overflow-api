import HTTP_STATUS_CODES from "../constants/status-code";
import express from "express";
import { db } from "../lib/db";
import { GetQuestionsQuery } from "types/shared";

export const getAllUsers = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const {
      filter,
      page = 1,
      pageSize = 12,
      searchQuery,
    } = req.query as GetQuestionsQuery;

    const skipAmount = (page - 1) * pageSize;

    let sortOption = {};

    switch (filter) {
      case "new_users":
        sortOption = { joinedAt: "desc" };
        break;
      case "old_users":
        sortOption = { joinedAt: "asc" };
        break;
      case "reputation":
        sortOption = { reputation: "desc" };
        break;
      case "name":
        sortOption = [{ name: "asc" }, { username: "asc" }];
        break;
      default:
        break;
    }

    const users = await db.user.findMany({
      where: searchQuery
        ? {
            OR: [
              {
                name: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              {
                username: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
      skip: skipAmount,
      take: pageSize,
      orderBy: sortOption,
    });

    if (!users) {
      return next({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        error: "Users not found",
      });
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      results: users.length,
      data: users,
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

export const getUserById = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const userId = req.params.id;
    const user = await db.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        location: true,
        portfolioWebsite: true,
        reputation: true,
        joinedAt: true,
      },
    });

    if (!user) {
      return next({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        error: "User not found",
      });
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: user,
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

export const getUserStats = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const userId = req.body.userId;

    const totalQuestions = await db.question.count({
      where: {
        authorId: userId,
      },
    });

    const totalAnswers = await db.userAnswerQuestion.count({
      where: {
        userId: userId,
      },
    });

    const totalQuestionsUpvote = await db.userUpvotesQuestion.count({
      where: {
        question: {
          authorId: userId,
        },
      },
    });

    const totalAnswersUpvote = await db.userAnswerQuestionUpvotes.count({
      where: {
        questionAnswered: {
          userId: userId,
        },
      },
    });

    const totalViews = await db.question.aggregate({
      _sum: {
        views: true,
      },
      where: {
        authorId: userId,
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: {
        totalQuestions,
        totalAnswers,
        totalQuestionsUpvote,
        totalAnswersUpvote,
        totalViews: totalViews._sum.views,
      },
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

// Only filter and pagination
export const getUserQuestions = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const userId = req.params.userId;

    const { filter, page = 1, pageSize = 5 } = req.query as GetQuestionsQuery;
    const skipAmount = (page - 1) * pageSize;
    let sortOption = {};

    switch (filter) {
      case "newest":
        sortOption = { createdAt: "desc" };
        break;
      case "oldest":
        sortOption = { createdAt: "asc" };
        break;
      case "most_views":
        sortOption = { views: "desc" };
        break;
      default:
        break;
    }

    const questions = await db.question.findMany({
      where: {
        authorId: userId,
      },
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
    });

    const questionCount = await db.question.count({
      where: {
        authorId: userId,
      },
    });

    if (!questions || questions.length === 0) {
      return next({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        error: "Questions not found",
      });
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      results: questionCount,
      data: questions,
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};
