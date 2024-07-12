import { protect } from "../controllers/auth-controller";
import {
  GetAllAnswers,
  createAnswerQuestion,
  deleteAnswerById,
  downvoteAnswer,
  editAnswer,
  getAnswerById,
  upvoteAnswer,
} from "../controllers/answer-controller";
import express from "express";

export const answer = (router: express.Router) => {
  router.route("/answers").post(protect, createAnswerQuestion);

  router
    .route("/answers/:id")
    .get(getAnswerById)
    .patch(protect, editAnswer)
    .delete(protect, deleteAnswerById);

  router.route("/answers/upvotes").post(protect, upvoteAnswer);

  router.route("/answers/downvotes").post(protect, downvoteAnswer);

  router.route("/answers/:question_id").post(GetAllAnswers);
};
