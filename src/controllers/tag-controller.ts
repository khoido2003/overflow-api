import HTTP_STATUS_CODES from "../constants/status-code";
import express from "express";
import { db } from "../lib/db";
import { GetQuestionsQuery } from "types/shared";

export const getAllTags = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const {
      filter,
      page = 1,
      pageSize = 8,
      searchQuery,
    } = req.query as GetQuestionsQuery;

    const skipAmount = (page - 1) * pageSize;

    let sortOption = {};

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
        sortOption = { createdAt: "desc" };
        break;
    }

    let searchOptions = {};

    if (searchQuery) {
      searchOptions = {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
      };
    }

    const tags = await db.tag.findMany({
      where: {
        AND: [
          // only get tags that have questions
          {
            tagOnQuestion: {
              some: {},
            },
          },
          searchOptions,
        ],
      },
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
      take: +pageSize,
      orderBy: sortOption,
    });

    const tagsCount = await db.tag.count({
      where: {
        AND: [
          {
            tagOnQuestion: {
              some: {},
            },
          },
          searchOptions,
        ],
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      results: tagsCount,
      data: tags,
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

export const getTagById = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const id = req.params.id;

    const tag = await db.tag.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
      },
    });
    return res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: {
        ...tag,
      },
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
    const { tagId } = req.params;

    const {
      page = 1,
      pageSize = 5,
      searchQuery,
    } = req.query as GetQuestionsQuery;
    const skipAmount = (page - 1) * pageSize;

    let searchOption: any = {};

    if (searchQuery)
      searchOption.OR = [
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
      ];

    const questions = await db.tagOnQuestion.findMany({
      where: {
        AND: [
          {
            tagId: tagId,
          },
          {
            question: searchOption,
          },
        ],
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
      skip: skipAmount,
      take: +pageSize,
    });

    const questionsCount = await db.tagOnQuestion.count({
      where: {
        AND: [
          {
            tagId: tagId,
          },
          {
            question: searchOption,
          },
        ],
      },
    });

    return res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: {
        questionsCount,
        questions: questions.map((q) => q.question),
      },
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

export const GetTop5Tags = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const tags = await db.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tagOnQuestion: true,
          },
        },
      },

      orderBy: [{ tagOnQuestion: { _count: "desc" } }],
      take: 5,
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: tags,
    });
  } catch (error) {
    console.log(error);
    next({
      error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};
