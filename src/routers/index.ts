import express from "express";
import auth from "./auth";
import { question } from "./question";
import { user } from "./user";
import { answer } from "./answer";
import { tag } from "./tag";

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

  tag(router);

  return router;
};

export default routesHandler;
