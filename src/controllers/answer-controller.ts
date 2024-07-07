import {
  AnswerQuestionValidator,
  GetAnswersQuestionValidator,
  UpvoteDownvoteAnswerValidator,
} from "../lib/validators/answer";
import HTTP_STATUS_CODES from "../constants/status-code";
import express from "express";
import { db } from "../lib/db";

// Create new answer to a question
export const createAnswerQuestion = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { author, content, questionId } = AnswerQuestionValidator.parse(
      req.body
    );

    const answer = await db.userAnswerQuestion.create({
      data: {
        content,
        userId: author,
        questionId,
      },
    });

    res.status(HTTP_STATUS_CODES.CREATED).json({
      message: "Success",
      data: answer,
    });
  } catch (error) {
    console.log(error);
    next({
      error: error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

////////////////////////////////////////////////////

// Get all answers from a question
export const GetAllAnswers = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { questionId } = GetAnswersQuestionValidator.parse(req.body);

    const { filter } = req.query;

    let sortOptions = {};

    switch (filter) {
      case "highest-upvotes":
        sortOptions = {
          questionUpvotes: {
            _count: "desc",
          },
        };
        break;
      case "lowest-upvotes":
        sortOptions = {
          questionDownvotes: {
            _count: "desc",
          },
        };
        break;

      case "most-recent":
        sortOptions = {
          createdAt: "desc",
        };
        break;

      case "oldest":
        sortOptions = {
          createdAt: "asc",
        };
        break;
      default:
        break;
    }

    const answers = await db.userAnswerQuestion.findMany({
      where: {
        questionId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        questionDownvotes: {
          select: {
            id: true,
            userId: true,
          },
        },
        questionUpvotes: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy: sortOptions,
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: answers,
    });
  } catch (error) {
    console.log(error);
    next({
      error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

/////////////////////////////////////////////////

// Upvotes/DownVotes Answer

export const upvoteAnswer = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { questionAnsweredId, userId } = UpvoteDownvoteAnswerValidator.parse(
      req.body
    );

    // Start the transaction
    await db.$transaction(async (tx) => {
      const existingUpvote = await tx.userAnswerQuestionUpvotes.findFirst({
        where: {
          questionAnsweredId,
          userId,
        },
      });

      if (existingUpvote) {
        // Delete the existing upvote
        await tx.userAnswerQuestionUpvotes.delete({
          where: { id: existingUpvote.id },
        });
      } else {
        const existingDownvotes =
          await tx.userAnswerQuestionDownvotes.findFirst({
            where: {
              questionAnsweredId,
              userId,
            },
          });

        // Remove the downvotes before upvote the answer
        if (existingDownvotes) {
          await tx.userAnswerQuestionDownvotes.delete({
            where: { id: existingDownvotes.id },
          });
        }

        // Actual upvote the answer
        await tx.userAnswerQuestionUpvotes.create({
          data: { questionAnsweredId, userId },
        });
      }
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Upvote answer toggled successfully",
    });
  } catch (error) {
    console.log(error);
    next({
      error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

// Downvote an answer
export const downvoteAnswer = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { questionAnsweredId, userId } = UpvoteDownvoteAnswerValidator.parse(
      req.body
    );

    // Start the transaction
    await db.$transaction(async (tx) => {
      const existingDownvote = await tx.userAnswerQuestionDownvotes.findFirst({
        where: {
          questionAnsweredId,
          userId,
        },
      });

      if (existingDownvote) {
        await tx.userAnswerQuestionDownvotes.delete({
          where: { id: existingDownvote.id },
        });
      } else {
        const existingUpvotes = await tx.userAnswerQuestionUpvotes.findFirst({
          where: {
            questionAnsweredId,
            userId,
          },
        });

        if (existingUpvotes) {
          await tx.userAnswerQuestionUpvotes.delete({
            where: { id: existingUpvotes.id },
          });
        }
        await tx.userAnswerQuestionDownvotes.create({
          data: { questionAnsweredId, userId },
        });
      }
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Downvote answer toggled successfully",
    });
  } catch (error) {
    console.log(error);
    next({
      error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};
