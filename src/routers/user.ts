import express from "express";

export const user = (router: express.Router) => {
  router.route("/user/:id").get();
};
