import express from "express";
import { apiRouter } from "../server/apiRouter.ts";

const app = express();

app.use(express.json({ limit: "10mb" }));

// Support both /api/* and root paths depending on Vercel rewrite handling
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
