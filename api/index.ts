import express from "express";
import dotenv from "dotenv";
import { apiRouter } from "../server/apiRouter.ts";

dotenv.config();

const app = express();

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

// Support both /api/* and root paths depending on Vercel rewrite handling
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
