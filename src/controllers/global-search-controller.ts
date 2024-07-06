import { db } from "../lib/db";
import HTTP_STATUS_CODES from "../constants/status-code";
import express from "express";

type QueryString = {
  query: string;
  type: string;
};

type PrismaModel =
  | typeof db.question
  | typeof db.user
  | typeof db.userAnswerQuestion
  | typeof db.tag;

type ModelInfo = {
  model: PrismaModel;
  searchField: string;
  includeRelation?: object;
};

// The url will look something like this:

// http://localhost:8005/api/v1/global-search?query=pris&type=tag

// Since this is a very hard api, so this is the example of what we want after query through everything. So based on this, we will manipulate the results come from prisma to recieve what we want.
/*
{
    "message": "Success",
    "results": 3,
    "data": [
        {
            "title": "Index configuration in Prisma",
            "id": "2bf485b7-eefc-453e-a185-794c606c86f6",
            "type": "question"
        },
        {
            "title": "Answer come from question: Index configuration in Prisma containing pris",
            "id": "958e4fe4-607a-4ba8-bc08-9e88619fe497",
            "type": "answer"
        },
        {
            "title": "prisma",
            "id": "f542caf5-30e3-4793-8d16-2b2006b3ffac",
            "type": "tag"
        }
    ]
}
*/

// TODO: Update query sql to query in vector database to search for semantic results

export const globalSearchController = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    // The url contain the query string and the type of field that user want to search
    // If the type is not specified then search through everything but if it exists then search exactly the field
    const { query, type } = req.query as QueryString;

    let results = [];
    const searchTypes = ["question", "user", "answer", "tag"];

    if (!type || !searchTypes.includes(type.toLowerCase())) {
      // Search global through questions, users, answers and tags
      const searchPromises = [
        // Find 2 relevant questions
        db.question.findMany({
          where: {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          select: {
            title: true,
            id: true,
          },
          take: 2,
        }),

        // Find 2 users relevant
        db.user.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          select: {
            name: true,
            id: true,
          },
          take: 2,
        }),

        // Find 2 answer users relevant
        db.userAnswerQuestion.findMany({
          where: {
            content: {
              contains: query,
              mode: "insensitive",
            },
          },
          select: {
            // Since the answer will contain a long content which will be hard to displayed in search results so we need to pull the question title as well to tell the user where the answer comes from.
            content: true,
            id: true,
            question: {
              select: {
                title: true,
                id: true,
              },
            },
          },
          take: 2,
        }),

        // Find 2 tags relevant
        db.tag.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          select: {
            name: true,
            id: true,
          },
          take: 2,
        }),
      ];

      // Await the results
      const resultsArray = await Promise.all(searchPromises);

      // Push all the results to the results array. We do this because we don't know the exact number of results each search query will return.
      resultsArray.forEach((result, index) => {
        // This will help us determine which is the result type
        const typeMapping = ["question", "user", "answer", "tag"];
        const typeName = typeMapping[index];

        // Manipulate the results before display
        results.push(
          ...result.map((item) => ({
            title:
              typeName === "answer"
                ? //@ts-ignore
                  `Answer containing "${query}" come from question: ${item.question.title} `
                : //@ts-ignore
                  typeName === "tag" || typeName === "user"
                  ? // @ts-ignore
                    item.name
                  : // @ts-ignore
                    item.title,
            //@ts-ignore
            id: typeName === "answer" ? item.question.id : item.id,
            type: typeName,
          }))
        );
      });
    } else {
      // If the user specified the field that need to search then we need to extract that field to query exactly the results
      const modelInfo: ModelInfo | undefined = {
        question: {
          model: db.question,
          searchField: "title",
        },
        user: {
          model: db.user,
          searchField: "name",
        },
        answer: {
          model: db.userAnswerQuestion,
          searchField: "content",
          includeRelation: {
            select: {
              title: true,
            },
          },
        },
        tag: {
          model: db.tag,
          searchField: "tag",
        },
      }[type.toLocaleLowerCase()]; // Take out the field

      // If the field is not valid then return error
      if (!modelInfo) {
        next({
          error: {
            message:
              "This field is not allowed! Choose one of the following fields: question, answer, user, tag",
          },
          statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
        });
      }

      // After receiving the field that the user wants, query the results
      const queryOptions: any = {
        where: {
          [modelInfo.searchField]: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          [modelInfo.searchField]: true,
          id: true,
        },
        take: 8,
      };

      // See the query format with this
      // console.log(modelInfo.includeRelation);

      // If the user search the content then include the question title
      if (modelInfo.includeRelation) {
        queryOptions.select = {
          ...queryOptions.select,
          question: modelInfo.includeRelation,
        };
      }

      // Query the database and get the results. We use 'as PrismaModel' to make sure that the returned type is a valid Prisma Model.
      // @ts-ignore
      const queryResults = await (modelInfo.model as PrismaModel).findMany(
        queryOptions
      );

      // Inlcude the type to the results so in the frontend we can display the type of the result when displaying

      // @ts-ignore
      results = queryResults.map((item) => ({
        title:
          type === "answer"
            ? //@ts-ignore
              `Answer containing "${query}" come from question: ${item.question.title} `
            : //@ts-ignore
              type === "tag" || type === "user"
              ? // @ts-ignore
                item.name
              : // @ts-ignore
                item.title,
        id: type === "answer" ? item.question.id : item.id,
        type: type,
      }));
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      results: results.length,
      data: results,
    });
  } catch (error) {
    console.log(error);
    next({ error, statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR });
  }
};
