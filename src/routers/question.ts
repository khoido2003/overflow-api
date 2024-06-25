import { protect } from "../controllers/auth-controller";
import { createQuestion } from "../controllers/question-controller";
import express from "express";

export const question = (router: express.Router) => {
  router.post("/questions", protect, createQuestion);
};
