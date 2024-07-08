import express from "express";
import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";
import jwt from "jsonwebtoken";

import { db } from "../lib/db";

interface IJWT {
  id: string;
  name: string;
  email: string;
}

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
    },
  })
    .middleware(
      async ({ req, res }: { req: express.Request; res: express.Response }) => {
        let token;

        // Authenticate with Bearer token in headers
        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith("Bearer")
        ) {
          token = req.headers.authorization.split(" ")[1];
        }
        // Authenticate with cookie
        else if (req.cookies.auth_token) {
          token = req.cookies.auth_token;
        }

        if (!token) {
          throw new UploadThingError("Unauthorized!");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as IJWT;

        const currentUser = await db.user.findFirst({
          where: {
            id: decoded.id,
          },
        });

        if (!currentUser) {
          throw new UploadThingError("Unauthorized!");
        }

        return { id: currentUser.id };
      }
    )
    .onUploadComplete(async ({ metadata, file }) => {
      // The id of the user come from the request
      const { id } = metadata;

      // Update the image url in the database
      const updateImage = await db.user.update({
        where: { id },
        data: {
          image: file.url,
        },
      });

      return { userId: updateImage.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
