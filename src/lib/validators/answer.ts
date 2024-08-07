import z from "zod";

// Validator

export const AnswerQuestionValidator = z.object({
  content: z.string(),
  author: z.string(),
  questionId: z.string(), // reference to the question id
});

export const GetAnswersQuestionValidator = z.object({
  questionId: z.string(),
});

export const UpvoteDownvoteAnswerValidator = z.object({
  userId: z.string(),
  questionAnsweredId: z.string(),
});

////////////////////////////////////////////////////////

// Types

export type AnswerQuestionPayload = z.infer<typeof AnswerQuestionValidator>;
export type GetAnswerQuestionPayload = z.infer<typeof AnswerQuestionValidator>;
export type UpvoteDownvoteAnswerPayload = z.infer<
  typeof UpvoteDownvoteAnswerValidator
>;
