import express from "express";

const auth = (router: express.Router) => {
  router.get("/login", (req: express.Request, res: express.Response) => {
    return res
      .status(200)
      .json({
        message: "Hello, world!",
      })
      .end();
  });
};

export default auth;
