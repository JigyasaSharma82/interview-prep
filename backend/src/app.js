import express from "express";
import cors from "cors";
import env from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import kitRoutes from "./routes/kit.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

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