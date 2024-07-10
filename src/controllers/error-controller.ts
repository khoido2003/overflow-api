import express from "express";
import { ZodError } from "zod";
import HTTP_STATUS_CODES from "../constants/status-code";
import { Prisma } from "@prisma/client";

export interface IError {
  error: Error;
  statusCode: number;
}

const errorController = (
  errObj: IError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  //  ---------- PRODUCTION + DEVELOPMENT ----------------

  // Handle zod validation errors (use for both production and development)
  if (errObj.error instanceof ZodError) {
    const errorMessages = errObj.error.errors.map((issue: any) => ({
      path: `${issue.path.join(".")}`,
      message: `${issue.message}`,
    }));

    res.status(errObj.statusCode).json({
      status: "fail",
      error: "Invalid data",
      details: errorMessages,
    });
  }

  //////////////////////////////////////////////////

  // ---- PRODUCTION MODE -----

  // Send generic error message in production mode
  if (process.env.NODE_ENV === "production") {
    // Handle Prisma error
    if (errObj.error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle constraint violation
      if (errObj.error.code === "P2002") {
        res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: "fail",
          message: "Invalid data",
          details: [
            {
              model: `${errObj.error.meta.modelName}`,
              path: `${errObj.error.meta.target}`,
              message: `There is a unique constraint violation in this field: ${errObj.error.meta.target}`,
            },
          ],
        });
      }
    }

    // If unknown error
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Something went wrong! Please try again later.",
    });
  }

  ///////////////////////////////////////////////////////////

  // ------ DEVELOPMENT MODE -----------

  // Send detail error message in development mode
  if (process.env.NODE_ENV === "development") {
    res
      .status(errObj.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({
        status: "error",
        error: errObj.error,
      });
  }
};

export default errorController;
