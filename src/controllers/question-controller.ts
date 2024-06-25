import { AskQuestionValidator } from "../lib/validators/question";
import HTTP_STATUS_CODES from "../constants/status-code";
import express from "express";
import { db } from "../lib/db";

// Create new question
export const createQuestion = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { content, tags, title, author } = AskQuestionValidator.parse(req.body);

  try {
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
    next(error);
  }
};

////////////////////
