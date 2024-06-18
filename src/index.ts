import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
// import xssClean from "xss-clean";
// import rateLimit from "express-rate-limit";

import routesHandler from "./routers/index";

const app = express();

// Read .env file
dotenv.config();

// Set up cors to allow requests and responses from other sites
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Reduce the size of the response body to reduce bandswidth usage
app.use(compression());

// Allow read the cookies
app.use(cookieParser());

// Allow read the body
app.use(bodyParser.json());

// // Data sanitization agains xss
// app.use(xssClean);

// // Rate limiting to prevent brute force attacks -- use in production
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again after 15 minutes",
// });

// app.use(limiter)

// Init the server with express
const server = http.createServer(app);

server.listen(process.env.SERVER_PORT || 8006, () => {
  console.log(`Server is running on port ${process.env.SERVER_PORT || 8006}`);
});

// Handle routes in server
app.use("/", routesHandler());

process.on("unhandledRejection", (error) => {
  console.log(error);
  process.exit(1);
});
