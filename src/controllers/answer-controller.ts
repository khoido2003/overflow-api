import {
  AnswerQuestionValidator,
  GetAnswersQuestionValidator,
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

    const answers = await db.userAnswerQuestion.findMany({
      where: {
        questionId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true,
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
