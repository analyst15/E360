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
app.use((req, _res, next) => {
  // If Vercel rewrote /api/(.*) -> /api?0=$1
  const queryMatch = req.url.match(/[?&]0=([^&]+)/);
  if (queryMatch) {
    const subPath = decodeURIComponent(queryMatch[1]);
    const cleanSubPath = subPath.startsWith("/") ? subPath : `/${subPath}`;
    const cleanQuery = req.url.replace(/[?&]0=[^&]+/, "").replace(/\?$/, "");
    const queryString = cleanQuery.includes("?") ? cleanQuery.slice(cleanQuery.indexOf("?")) : "";
    req.url = `${cleanSubPath}${queryString}`;
  } else if (req.headers["x-matched-path"]) {
    const matched = req.headers["x-matched-path"] as string;
    if (matched.startsWith("/api/")) {
      req.url = matched.slice(4);
    }
  }
  next();
});

app.use("/api", apiRouter);
app.use("/", apiRouter);

// Fallback JSON 404 handler (prevents returning HTML to API consumers)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.url}`,
    hint: "Verify endpoint path and method in client request.",
  });
});

// Global Error Handler: guarantees API returns structured JSON, not raw server error HTML
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Vercel Serverless Function error:", err);
  res.status(500).json({
    success: false,
    error: err?.message || "Internal Server Error in serverless execution",
    stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined,
  });
});

export default app;
