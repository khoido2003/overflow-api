import express from "express";

import { getUserById, getUserStats } from "../controllers/user-controller";

export const user = (router: express.Router) => {
  router.route("/users/stats").post(getUserStats);

  router.route("/users/:id").get(getUserById);
};
