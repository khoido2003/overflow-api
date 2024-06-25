import express from "express";
import auth from "./auth";
import { question } from "./question";

// Init the router
const router = express.Router();

const routesHandler = (): express.Router => {
  // Authentication routes
  auth(router);

  // Question routes
  question(router);

  return router;
};

export default routesHandler;
