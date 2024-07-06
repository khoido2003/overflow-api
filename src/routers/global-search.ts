import { globalSearchController } from "../controllers/global-search-controller";
import express from "express";

export const globalSearch = (router: express.Router) => {
  router.get("/global-search", globalSearchController);
};
