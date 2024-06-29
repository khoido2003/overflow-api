import express from "express";

import { getUserById } from "../controllers/user-controller";

export const user = (router: express.Router) => {
  router.route("/user/:id").get(getUserById);
};
