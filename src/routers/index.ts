import express from "express";
import auth from "./auth";
import { question } from "./question";
import { user } from "./user";
import { answer } from "./answer";

// Init the router
const router = express.Router();

const routesHandler = (): express.Router => {
  // Authentication routes
  auth(router);

  // Question routes
  question(router);

  // User routes
  user(router);

  // Answer questions
  answer(router);

  return router;
};

export default routesHandler;
