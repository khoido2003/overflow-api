import { protect } from "../controllers/auth-controller";
import {
  createQuestion,
  getQuestions,
} from "../controllers/question-controller";
import express from "express";

export const question = (router: express.Router) => {
  router.route("/questions").post(protect, createQuestion).get(getQuestions);
};
