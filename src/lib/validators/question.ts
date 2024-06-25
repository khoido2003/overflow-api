import z from "zod";

export const AskQuestionValidator = z.object({
  title: z.string(),
  content: z.string().min(100),
  tags: z.array(z.string().min(1).max(15)).min(1),
  author: z.string(),
});

///////////////////////////////////////////////

export type AskQuestionPayload = z.infer<typeof AskQuestionValidator>;
