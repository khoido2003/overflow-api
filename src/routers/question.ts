import { protect } from "../controllers/auth-controller";
import {
  createQuestion,
  downvoteQuestion,
  getQuestionByID,
  getQuestions,
  updateQuestionView,
  upvoteQuestion,
} from "../controllers/question-controller";
import express from "express";

export const question = (router: express.Router) => {
  router.route("/questions").post(protect, createQuestion).get(getQuestions);

  router.route("/questions/upvotes").post(protect, upvoteQuestion);

  router.route("/questions/downvotes").post(protect, downvoteQuestion);

  router.route("/questions/views/:id").post(updateQuestionView);

  router.route("/questions/:id").get(getQuestionByID);
};
