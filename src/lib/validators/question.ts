import z from "zod";

export const AskQuestionValidator = z.object({
  title: z.string(),
  content: z.string().min(100),
  tags: z.array(z.string().min(1).max(15)).min(1),
  author: z.string(),
});

export const UpvoteDownvoteQuestionValidator = z.object({
  userId: z.string(),
  questionId: z.string(),
});

export const BookmarkQuestionValidator = z.object({
  userId: z.string(),
  questionId: z.string(),
});

///////////////////////////////////////////////

export type AskQuestionPayload = z.infer<typeof AskQuestionValidator>;
export type UpvoteDownvoteQuestionPayload = z.infer<
  typeof UpvoteDownvoteQuestionValidator
>;
export type BookmarkQuestionPayload = z.infer<typeof BookmarkQuestionValidator>;
