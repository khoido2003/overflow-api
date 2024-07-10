import express from "express";

import {
  getAllUsers,
  getUserById,
  getUserQuestions,
  getUserStats,
  updateUserProfile,
} from "../controllers/user-controller";
import { protect } from "../controllers/auth-controller";

export const user = (router: express.Router) => {
  router.route("/users/stats").post(getUserStats);

  router.route("/users").get(getAllUsers);

  router.route("/users/:id").get(getUserById).patch(protect, updateUserProfile);

  router.route("/users/:userId/questions").get(getUserQuestions);
};
