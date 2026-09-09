import crypto from "node:crypto";
import Kit from "../models/Kit.js";
import { generateKit } from "../services/kits/kitGenerator.js";
import { validateCompleteKit } from "../services/kits/kitValidator.js";

const getGenerationKey = ({ jd, company_url, days }) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify({ jd, company_url, days }))
    .digest("hex");

const runKitGeneration = async (kit, input) => {
  try {
    kit.generation_stage = "generating";
    await kit.save();

    const generatedKit = await generateKit({
      ...input,
      onStage: async (stage) => {
        kit.generation_stage = stage;
        await kit.save();
      },
    });

    Object.assign(kit, generatedKit, {
      generation_status: "completed",
      generation_stage: "completed",
      generation_error: null,
    });
    await kit.save();
  } catch (error) {
    kit.generation_status = "failed";
    kit.generation_stage = error.stage || "failed";
    kit.generation_error = error.message || "Kit generation failed";
    await kit.save();
  }
};

export const createKit = async (req, res, next) => {
  try {
    const { jd, company_url, days } = req.body;
    const generationKey = getGenerationKey({
      jd,
      company_url,
      days,
    });

    const existingKit = await Kit.findOne({
      user_id: req.user.id,
      generation_key: generationKey,
      generation_status: "generating",
    });

    if (existingKit) {
      return res.status(409).json({
        success: false,
        message: "This kit is already being generated",
        data: existingKit,
      });
    }

    const kit = await Kit.create({
      user_id: req.user.id,
      generation_key: generationKey,
      generation_status: "generating",
      generation_stage: "queued",
      source: {
        company_url,
      },
      schedule: {
        days_available: days,
      },
    });

    void runKitGeneration(kit, {
      jd,
      company_url,
      days,
    });

    res.status(202).json({
      success: true,
      message: "Kit generation started",
      data: kit,
    });
  } catch (error) {
    next(error);
  }
};
export const getKits = async (req, res, next) => {
  try {
    const kits = await Kit.find({
      user_id: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: kits,
    });
  } catch (error) {
    next(error);
  }
};
export const getKitById = async (req, res, next) => {
  try {
    const { kitId } = req.params;

    const kit = await Kit.findOne({
      _id: kitId,
      user_id: req.user.id,
    });

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: "Kit not found",
      });
    }

    res.status(200).json({
      success: true,
      data: kit,
    });
  } catch (error) {
    next(error);
  }
};
export const updateKit = async (req, res, next) => {
  try {
    const { kitId } = req.params;

    const kit = await Kit.findOne({
      _id: kitId,
      user_id: req.user.id,
    });

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: "Kit not found",
      });
    }

    const allowedFields = [
      "company_brief",
      "questions",
      "flashcards",
      "role",
      "schedule",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        kit[field] = req.body[field];
      }
    }

    const kitObject = kit.toObject();

    validateCompleteKit(kitObject);

    await kit.save();

    res.status(200).json({
      success: true,
      message: "Kit updated successfully",
      data: kit,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteKit = async (req, res, next) => {
  try {
    const { kitId } = req.params;

    const kit = await Kit.findOneAndDelete({
      _id: kitId,
      user_id: req.user.id,
    });

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: "Kit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Kit deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};