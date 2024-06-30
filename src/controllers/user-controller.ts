import HTTP_STATUS_CODES from "../constants/status-code";
import express from "express";
import { db } from "../lib/db";

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
        _count: {
          select: {
            questions: true,
            answerQuestions: true,
          },
        },
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
