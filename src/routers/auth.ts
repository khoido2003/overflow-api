import express from "express";

import { login, logout, protect, signUp } from "../controllers/auth-controller";

const auth = (router: express.Router) => {
  router.post("/register", signUp);
  router.post("/login", login);
  router.get("/logout", logout);
  router.get(
    "/hello",
    protect,
    (req: express.Request, res: express.Response) => {
      res.status(200).json({
        status: "success",
        data: {
          // @ts-ignore
          user: req.user,
        },
      });
    }
  );
};

export default auth;
