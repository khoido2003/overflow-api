import express from "express";
import { getAllTags, getQuestionByTagId } from "../controllers/tag-controller";

export const tag = (router: express.Router) => {
  router.route("/tags").get(getAllTags);
  router.route("/tags/:id").get(getQuestionByTagId);
};
