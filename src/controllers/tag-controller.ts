import HTTP_STATUS_CODES from "../constants/status-code";
import express from "express";
import { db } from "../lib/db";
import { GetQuestionsQuery } from "types/shared";
import { question } from "routers/question";

export const getAllTags = async (
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

    // TODO: IMPLEMNT popular tag
    switch (filter) {
      case "popular_tag":
        sortOption = {
          tagOnQuestion: {
            _count: "desc",
          },
        };
        break;
      case "recent_tag":
        sortOption = { createdAt: "desc" };
        break;
      case "old_tag":
        sortOption = { createdAt: "asc" };
        break;
      case "name":
        sortOption = { name: "asc" };
        break;
      default:
        break;
    }

    const tags = await db.tag.findMany({
      where: searchQuery
        ? {
            name: {
              contains: searchQuery,
              mode: "insensitive",
            },
          }
        : {},
      select: {
        id: true,
        name: true,
        desctiption: true,

        _count: {
          select: {
            tagOnQuestion: true,
          },
        },
      },
      skip: skipAmount,
      take: pageSize,
      orderBy: sortOption,
    });

    if (!tags) {
      return next({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        error: "Tags not found",
      });
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      result: tags.length,
      data: tags,
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

export const getQuestionByTagId = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params;
    const tag = await db.tag.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!tag) {
      return next({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        error: "Tag not found",
      });
    }

    const questions = await db.tagOnQuestion.findMany({
      where: {
        tagId: id,
      },
      select: {
        question: {
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
        },
      },
    });

    if (!questions) {
      return next({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        error: "Questions not found",
      });
    }

    return res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: {
        tag,
        questions,
      },
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

export const getPopularTag = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};
