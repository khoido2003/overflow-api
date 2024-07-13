import express from "express";

import {
  changePasswordCredentials,
  changePasswordOauth,
  changePasswordPostman,
  getAccountUser,
  login,
  logout,
  protect,
  signUp,
} from "../controllers/auth-controller";

const auth = (router: express.Router) => {
  router.post("/register", signUp);
  router.post("/login", login);
  router.get("/logout", logout);
  router.post("/changePassword", protect, changePasswordPostman);

  router.get("/oauth/:userId", protect, getAccountUser);
  router.post(
    "/newPassword/credentials/:userId",
    protect,
    changePasswordCredentials
  );
  router.post("/newPassword/oauth/:userId", protect, changePasswordOauth);

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
