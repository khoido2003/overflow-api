import express from "express";

import { getUserById } from "../controllers/user-controller";

export const user = (router: express.Router) => {
  router.route("/users/:id").get(getUserById);
};
