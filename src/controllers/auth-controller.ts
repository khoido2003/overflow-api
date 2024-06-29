import express from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { db } from "../lib/db";
import { User } from "@prisma/client";
import { loginValidator, signUpValidator } from "../lib/validators/auth";
import HTTP_STATUS_CODES from "../constants/status-code";

////////////////////////////////////////////////

interface IJWT {
  id: string;
  name: string;
  email: string;
}

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

//////////////////////////////////////////////////

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
      Date.now() + +process.env.JWT_COOKIES_EXPIRES_IN * 1000 * 24 * 60 * 60
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

// Hash password before stored to the database
const hashPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, 12);

  return hashedPassword;
};

// Check Password
const comparePassword = async (passwordInput: string, password: string) => {
  const result = await bcrypt.compare(passwordInput, password);

  return result;
};

//////////////////////////////////////////////////

// Register new user with credentials
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

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // If signUp successfully then send the token and response to user
    return createSendToken(user, HTTP_STATUS_CODES.CREATED, res);
  } catch (err) {
    console.log(err);

    return next({ error: err, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

////////////////////////////

// Login user with credentials
export const login = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    // If something go wrong here, zod will throw an error to handle in the global error handler
    const { email, password } = loginValidator.parse(req.body);

    const user = await db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return next({
        statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
        error: "This user does not exist!",
      });
    }

    if (!user || !(await comparePassword(password, user.password)))
      res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
        status: "unauthorized",
        message: "Your email or password is incorrect!",
      });

    // if successfully login
    createSendToken(user, HTTP_STATUS_CODES.OK, res);
  } catch (err) {
    console.log(err);
    return next({ error: err, statusCode: HTTP_STATUS_CODES.BAD_REQUEST });
  }
};

// Logout user by change the current token to a instant expired token
export const logout = (req: express.Request, res: express.Response) => {
  res.cookie("auth_token", "loggedout", {
    expires: new Date(Date.now() + 3 * 1000),
    httpOnly: true,
  });

  res.status(HTTP_STATUS_CODES.OK).json({
    status: "success",
    message: "Logged out successfully",
  });
};

//////////////////////////

// Protect route
export const protect = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    let token;

    // Authenticate with Bearer token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Authenticate with cookie
    else if (req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return next({
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
        error: "You are not logged in!",
        isDisplay: true,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as IJWT;

    const currentUser = await db.user.findFirst({
      where: {
        id: decoded.id,
      },
    });

    if (!currentUser) {
      return next({
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
        error: "The user belonging to this token is no longer exists.",
        isDisplay: true,
      });
    }

    // Store the user in the request as a session
    // @ts-ignore
    req.user = currentUser;

    next();
  } catch (err) {
    console.log(err);
    return next({
      error: err,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};
