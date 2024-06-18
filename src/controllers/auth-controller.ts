import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ZodError } from "zod";

import { db } from "../lib/db";
import { User } from "@prisma/client";
import { signUpValidator } from "../lib/validators/auth";
import HTTP_STATUS_CODES from "../constants/status-code";

////////////////////////////////////////////////

// Create jwt token
const signToken = (user: User) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      // JWT token last for 30 days
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

////////////////////////////////////////////

// Send jwt token through cookies
const createSendToken = (
  user: User,
  statusCode: number,
  res: express.Response
) => {
  // Add information user to the jwt token
  const token = signToken(user);

  // Config cookies options
  const cookieOptions = {
    // Cookies last for 30 days
    expires: new Date(
      Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN * 1000 * 24 * 60 * 60
    ),

    // In production only allow cookies be sent through https but in development also allow cookies to be sent through http
    secure: process.env.NODE_ENV === "production",

    httpOnly: true,
  };

  // Send the cookies
  res.cookie("auth_token", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

//////////////////////////////////////////////////

export const signUp = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    // Checking required fields inside req body
    const { name, email, password, passwordConfirm } = signUpValidator.parse(
      req.body
    );

    const user = await db.user.create({
      data: {
        name,
        email,
        password,
      },
    });

    // If signUp successfully then send the token and response to user
    createSendToken(user, HTTP_STATUS_CODES.CREATED, res);
  } catch (err) {
    console.log(err);
    // res.status(500).json({
    //   status: "error",
    //   message: "Something went wrong",
    //   error: err,
    // });

    if (err instanceof ZodError) {
      const errorMessages = err.errors.map((issue: any) => ({
        message: `${issue.path.join(".")} is ${issue.message}`,
      }));
      res
        .status(HTTP_STATUS_CODES.BAD_REQUEST)
        .json({ error: "Invalid data", details: errorMessages });
    } else {
      res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal Server Error" });
    }
  }
};
