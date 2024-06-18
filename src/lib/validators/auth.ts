import { z } from "zod";

// Validators

// Login
export const loginValidator = z.object({
  email: z.string().email({ message: "Email must be provided." }),
  password: z
    .string()
    .min(8, { message: "Passwords must be at least 8 characters." }),
});

// Register / Signup
export const signUpValidator = z
  .object({
    email: z.string().email({ message: "Email must be provided." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),

    passwordConfirm: z
      .string()
      .min(8, { message: "PasswordConfirm must be at least 8 characters." }),
    name: z.string().min(3, { message: "Name must be provided." }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match.",
    path: ["passwordConfirm"],
  });

///////////////////////////////////////////////////////////////////

// Types
export type loginPayload = z.infer<typeof loginValidator>;
export type signUpPayload = z.infer<typeof signUpValidator>;
