import express from "express";
import { ZodError } from "zod";
import AppError from "utils/app-error";

const handleZodValidationError = (error: Error) => {};

//////////////////////////////

const errorController = (
  error: AppError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Send generic error message in production mode
  if (process.env.NODE_ENV === "production") {
  }

  // Send detail error message in development mode
  if (process.env.NODE_ENV === "development") {
  }
};

export default errorController;
