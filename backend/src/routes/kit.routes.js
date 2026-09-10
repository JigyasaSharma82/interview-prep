import express from "express";
import { createKit, getKits, getKitById, updateKit, deleteKit } from "../controllers/kit.controller.js";
import { getPractice, savePracticeConfidence } from "../controllers/practice.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createKitSchema, updateKitSchema } from "../validators/kit.schemas.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(createKitSchema),
  createKit
);
router.get(
  "/",
  authenticate,
  getKits
);
router.get(
  "/:kitId",
  authenticate,
  getKitById
);
router.get(
  "/:kitId/practice",
  authenticate,
  getPractice
);
router.put(
  "/:kitId/practice/:itemId",
  authenticate,
  savePracticeConfidence
);
router.put(
  "/:kitId",
  authenticate,
  validate(updateKitSchema),
  updateKit
);
router.delete(
  "/:kitId",
  authenticate,
  deleteKit
);
export default router;