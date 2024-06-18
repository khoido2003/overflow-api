import express from "express";
import auth from "./auth";

// Init the router
const router = express.Router();

const routesHandler = (): express.Router => {
  // Authentication routes
  auth(router);

  return router;
};

export default routesHandler;
