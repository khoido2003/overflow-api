import z from "zod";

export const UpdateProfileValidator = z.object({
  name: z.string(),
  username: z.string().optional(),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  portfolioWebsite: z.string().url().optional(),
});

//////////////////////////////////

export type UpdateProfilePayload = z.infer<typeof UpdateProfileValidator>;
