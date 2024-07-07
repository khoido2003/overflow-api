import express from "express";
import {
  getAllTags,
  getQuestionByTagId,
  GetTop5Tags,
} from "../controllers/tag-controller";

export const tag = (router: express.Router) => {
  router.route("/tags").get(getAllTags);

  router.route("/top-5-tags").get(GetTop5Tags);

  router.route("/tags/:id").get(getQuestionByTagId);
};
