import express from "express";
import cors from "cors";
import env from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import kitRoutes from "./routes/kit.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { rateLimit } from "./middleware/rateLimit.middleware.js";
const app = express();

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set({
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
  });
  next();
});

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.use((req, res, next) => {
  console.log(`[request] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(`[response] ${req.method} ${req.originalUrl} ${res.statusCode}`);
  });

  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Interview Prep API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/kits", kitRoutes);

app.use(errorHandler);

export default app;