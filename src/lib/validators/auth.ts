import { z } from "zod";

// ----- Validators -------

// Login
export const loginValidator = z.object({
  email: z.string().email({ message: "email must be provided." }),
  password: z
    .string()
    .min(8, { message: "password must be at least 8 characters." }),
});

// Register / Signup
export const signUpValidator = z
  .object({
    email: z.string().email({ message: "email must be provided." }),
    password: z
      .string()
      .min(8, { message: "password must be at least 8 characters." }),

    passwordConfirm: z
      .string()
      .min(8, { message: "passwordConfirm must be at least 8 characters." }),
    name: z.string().min(3, { message: "name must be provided." }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "password and passwordConfirm do not match.",
    path: ["passwordConfirm"],
  });

export const changePasswordCredentialsValidator = z
  .object({
    oldPassword: z.string(),
    newPassword: z
      .string()
      .min(8, { message: "newPassword must be at least 8 characters." }),
    passwordConfirm: z
      .string()
      .min(8, { message: "newPasswordConfirm must be at least 8 characters." }),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: "New password and password confirm do not match.",
    path: ["passwordConfirm"],
  });

export const changePasswordOauthValidator = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "newPassword must be at least 8 characters." }),
    passwordConfirm: z
      .string()
      .min(8, { message: "newPasswordConfirm must be at least 8 characters." }),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: "password and passwordConfirm do not match.",
    path: ["passwordConfirm"],
  });

export const changePasswordPostmanValidator = z
  .object({
    email: z.string().email(),
    password: z.string(),
    newPassword: z.string().min(8),
    passwordConfirm: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: "password and passwordConfirm do not match.",
    path: ["passwordConfirm"],
  });

///////////////////////////////////////////////////////////////////

// ---- Types ----
export type loginPayload = z.infer<typeof loginValidator>;
export type signUpPayload = z.infer<typeof signUpValidator>;
export type changePasswordCredentialsPayload = z.infer<
  typeof changePasswordCredentialsValidator
>;
export type changePasswordOauthPayload = z.infer<
  typeof changePasswordOauthValidator
>;
