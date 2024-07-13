import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { db } from "../lib/db";
import { User } from "@prisma/client";
import {
  changePasswordCredentialsValidator,
  changePasswordOauthValidator,
  changePasswordPostmanValidator,
  loginValidator,
  signUpValidator,
} from "../lib/validators/auth";
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
    sameSite: "lax" as "lax",
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

///////////////////////////////////////////////////

// Find user that signIn by OAuth instead of credentials

// Since only user using OAuth have the infomation in the Account table so we will use that to decide whether who is logged in with OAuth or Credentials
export const getAccountUser = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { userId } = req.params;
    const account = await db.account.findFirst({
      where: {
        userId: userId,
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Success",
      data: account,
    });
  } catch (error) {
    console.error(error);
    return next({
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};

////////////////////////////////////////////

export const changePasswordCredentials = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { userId } = req.params;

    const { newPassword, oldPassword, passwordConfirm } =
      changePasswordCredentialsValidator.parse(req.body);

    const currentUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    // If the current user is not exists
    if (!currentUser)
      return next({
        error: {
          message: "User not found!",
          code: 404,
        },
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      });

    // If the password is invalid
    if (
      !currentUser ||
      !(await comparePassword(oldPassword, currentUser.password))
    )
      return next({
        error: {
          message: "Wrong password!",
          code: 401,
        },
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      });

    // Update user password
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        password: await hashPassword(newPassword),
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Password changed successfully!",
      code: 200,
    });
  } catch (error) {
    console.log(error);
    next({
      error: error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

//////////////////////////////////////////

export const changePasswordOauth = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { userId } = req.params;

    const { newPassword: password, passwordConfirm } =
      changePasswordOauthValidator.parse(req.body);

    const currentUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    // If the current user is not exists
    if (!currentUser)
      return next({
        error: {
          message: "User not found!",
          code: 404,
        },
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      });

    // Update user password
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        password: await hashPassword(password),
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Password changed successfully!",
      code: 200,
    });
  } catch (error) {
    console.log(error);
    next({
      error: error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

///////////////////////////////////////////

// Change password for user/admin access on Postman

export const changePasswordPostman = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { email, newPassword, passwordConfirm, password } =
      changePasswordPostmanValidator.parse(req.body);

    const user = await db.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return next({
        error: {
          message: "User not found!",
          code: 404,
        },
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    // If the password is invalid
    if (!user || !(await comparePassword(password, user.password)))
      return next({
        error: {
          message: "Wrong password!",
          code: 401,
        },
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      });

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await hashPassword(newPassword),
      },
    });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.log(error);
    next({
      error,
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};
