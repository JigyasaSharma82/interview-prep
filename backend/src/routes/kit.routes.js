import express from "express";
import { createKit } from "../controllers/kit.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createKitSchema } from "../validators/kit.schemas.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(createKitSchema),
  createKit
);

export default router;