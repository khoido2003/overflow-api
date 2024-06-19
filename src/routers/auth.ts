import express from "express";

import { login, logout, signUp } from "../controllers/auth-controller";

const auth = (router: express.Router) => {
  router.post("/register", signUp);
  router.post("/login", login);
  router.get("/logout", logout);
};

export default auth;
