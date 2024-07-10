import { protect } from "../controllers/auth-controller";
import {
  boormarkQuestionFn,
  createQuestion,
  downvoteQuestion,
  findBookmarkedQuestions,
  getQuestionByID,
  getQuestions,
  getTop5Questions,
  updateQuestionView,
  upvoteQuestion,
} from "../controllers/question-controller";
import express from "express";

export const question = (router: express.Router) => {
  router.route("/top-5-questions").get(getTop5Questions);

  router.route("/questions").post(protect, createQuestion).get(getQuestions);

  router.route("/questions/upvotes").post(protect, upvoteQuestion);

  router.route("/questions/downvotes").post(protect, downvoteQuestion);

  router
    .route("/questions/bookmark")
    .post(protect, boormarkQuestionFn)
    .get(protect, findBookmarkedQuestions);

  router.route("/questions/views/:id").post(updateQuestionView);

  router.route("/questions/:id").get(getQuestionByID);
};
