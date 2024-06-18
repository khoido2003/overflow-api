import express from "express";

import { signUp } from "../controllers/auth-controller";

const auth = (router: express.Router) => {
  router.post("/register", signUp);
};

export default auth;
