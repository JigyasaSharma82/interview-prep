import crypto from "node:crypto";
import Kit from "../models/Kit.js";
import { generateKit } from "../services/kits/kitGenerator.js";
import { validateCompleteKit } from "../services/kits/kitValidator.js";
import { validateStoredQuestionReferences } from "../services/kits/questionNormalizer.js";
import { regenerateCategorySchema } from "../validators/kit.schemas.js";
import {
  regenerateCompanyBrief,
  regenerateQuestionsForCategory,
  regenerateSchedule,
} from "../services/kits/kitRegenerator.js";

const getGenerationKey = ({ jd, company_url, days }) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify({ jd, company_url, days }))
    .digest("hex");

const KIT_GENERATION_TIMEOUT_MS = 10 * 60 * 1000;

const withTimeout = (promise, milliseconds) => {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Kit generation timed out")),
      milliseconds,
    );
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
};

const runKitGeneration = async (kit, input) => {
  console.log("KIT GENERATION STARTED", kit._id.toString());
  let generationActive = true;
  let currentStage = "queued";

  try {
    kit.generation_stage = "generating";
    await kit.save();

    const generatedKit = await withTimeout(
      generateKit({
        ...input,
        onStage: async (stage) => {
          if (!generationActive) return;

          currentStage = stage;
          console.log(`STAGE: ${stage}`);
          kit.generation_stage = stage;
          await kit.save();
        },
      }),
      KIT_GENERATION_TIMEOUT_MS,
    );

    Object.assign(kit, generatedKit, {
      generation_status: "completed",
      generation_stage: "completed",
      generation_error: null,
    });
    await kit.save();
    console.log("KIT GENERATION COMPLETED", kit._id.toString());
  } catch (error) {
    generationActive = false;

    console.log("KIT GENERATION FAILED", kit._id.toString());
    console.log("Stage:", error.stage || currentStage);
    console.log("Error:", error.message);

    kit.generation_status = "failed";
    kit.generation_stage = error.stage || currentStage || "failed";
    kit.generation_error = error.message || "Kit generation failed";

    console.log("Saving failed kit status...");

    await kit.save();

    console.log("Failed status saved:", {
      id: kit._id,
      status: kit.generation_status,
      stage: kit.generation_stage,
    });
  } finally {
    generationActive = false;
  }
};

export const createKit = async (req, res, next) => {
  try {
    console.log("Received request to create kit:", req.body);
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
      const staleBefore = new Date(Date.now() - KIT_GENERATION_TIMEOUT_MS);

      if (existingKit.updatedAt <= staleBefore) {
        existingKit.generation_status = "failed";
        existingKit.generation_stage = "failed";
        existingKit.generation_error =
          "Kit generation expired before completion";
        await existingKit.save();
      } else {
        console.log("Kit already being generated:", existingKit);
        return res.status(409).json({
          success: false,
          message: "This kit is already being generated",
          data: existingKit,
        });
      }
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
  console.log("Received request to get kits for user:", req.user.id);
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
    console.log("[kit] GET result requested:", kitId);

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

    validateStoredQuestionReferences(kit.toObject());

    console.log("[kit] GET result:", {
      id: kit._id.toString(),
      status: kit.generation_status,
      stage: kit.generation_stage,
      questionCount: kit.questions?.length || 0,
    });

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

    const sameContent = (left, right, fields) =>
      fields.every((field) =>
        JSON.stringify(left?.[field]) === JSON.stringify(right?.[field])
      );

    const markEdited = (value, existing, fields) => {
      if (!Array.isArray(value)) return value;

      const existingById = new Map(
        (existing || []).map((item) => [item.id, item])
      );

      return value.map((item) => {
        const previous = existingById.get(item.id);
        const state = item.content_state || previous?.content_state || {};
        const unchanged = previous && sameContent(item, previous, fields);

        return {
          ...item,
          content_state: {
            ...state,
            origin: state.origin === "handwritten"
              ? "handwritten"
              : unchanged
                ? state.origin || "generated"
                : "edited",
          },
        };
      });
    };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "questions" || field === "flashcards") {
          const fields = field === "questions"
            ? ["requirement_ids", "category", "prompt", "answer_outline", "difficulty"]
            : ["front", "back", "requirement_ids"];
          kit[field] = markEdited(req.body[field], kit[field], fields);
        } else if (field === "role") {
          kit[field] = {
            ...req.body[field],
            requirements: markEdited(
              req.body[field].requirements,
              kit.role.requirements,
              ["text", "kind", "priority"]
            ),
          };
        } else if (field === "company_brief") {
          const unchanged = sameContent(req.body[field], kit.company_brief, [
            "summary",
            "what_they_do",
            "interview_process",
            "sources",
          ]);
          kit[field] = {
            ...req.body[field],
            content_state: {
              ...(req.body[field].content_state || kit.company_brief.content_state || {}),
              origin: unchanged ? kit.company_brief.content_state?.origin || "generated" : "edited",
            },
          };
        } else {
          kit[field] = req.body[field];
        }
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

const findOwnedKit = (kitId, userId) =>
  Kit.findOne({ _id: kitId, user_id: userId });

export const regenerateKitCompanyBrief = async (req, res, next) => {
  try {
    const kit = await findOwnedKit(req.params.kitId, req.user.id);
    if (!kit) return res.status(404).json({ success: false, message: "Kit not found" });

    const regenerated = await regenerateCompanyBrief(kit);
    Object.assign(kit, { company_brief: regenerated.company_brief });
    await kit.save();
    res.status(200).json({ success: true, message: "Company brief regenerated", data: kit });
  } catch (error) {
    next(error);
  }
};

export const regenerateKitQuestions = async (req, res, next) => {
  try {
    const { category } = regenerateCategorySchema.parse(req.params);
    console.log("REGENERATING QUESTION CATEGORY:", category, req.params.kitId);
    const kit = await findOwnedKit(req.params.kitId, req.user.id);
    if (!kit) return res.status(404).json({ success: false, message: "Kit not found" });

    const regenerated = await regenerateQuestionsForCategory(kit, category);
    Object.assign(kit, {
      questions: regenerated.questions,
      schedule: regenerated.schedule,
      coverage: regenerated.coverage,
    });
    await kit.save();
    res.status(200).json({ success: true, message: "Question category regenerated", data: kit });
  } catch (error) {
    next(error);
  }
};

export const regenerateKitSchedule = async (req, res, next) => {
  try {
    const kit = await findOwnedKit(req.params.kitId, req.user.id);
    if (!kit) return res.status(404).json({ success: false, message: "Kit not found" });

    const regenerated = regenerateSchedule(kit);
    Object.assign(kit, {
      schedule: regenerated.schedule,
      coverage: regenerated.coverage,
    });
    await kit.save();
    res.status(200).json({ success: true, message: "Schedule regenerated", data: kit });
  } catch (error) {
    next(error);
  }
};
