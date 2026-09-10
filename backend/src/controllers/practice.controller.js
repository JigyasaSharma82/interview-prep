import mongoose from "mongoose";
import Kit from "../models/Kit.js";
import PracticeProgress from "../models/PracticeProgress.js";
import { sortPracticeItems } from "../services/practice/practiceOrdering.js";

const getOwnedKit = (kitId, userId) => {
  if (!mongoose.isValidObjectId(kitId)) return null;
  return Kit.findOne({ _id: kitId, user_id: userId });
};

const getPracticeItems = (kit) => {
  const requirements = new Map(
    kit.role.requirements.map((requirement) => [requirement.id, requirement])
  );
  const uncoveredRequirementIds = new Set(
    kit.coverage.uncovered_requirement_ids
  );

  const addCoverage = (item) => ({
    ...item,
    covered: item.requirement
      ? !uncoveredRequirementIds.has(item.requirement.id)
      : false,
  });

  return [
    ...kit.questions.map((question) => addCoverage({
      item_id: question.id,
      item_type: "question",
      prompt: question.prompt,
      answer: question.answer_outline,
      category: question.category,
      difficulty: question.difficulty,
      requirement: requirements.get(question.requirement_ids[0]) || null,
    })),
    ...kit.flashcards.map((flashcard) => addCoverage({
      item_id: flashcard.id,
      item_type: "flashcard",
      prompt: flashcard.front,
      answer: flashcard.back,
      category: "flashcard",
      difficulty: 0,
      requirement: requirements.get(flashcard.requirement_ids[0]) || null,
    })),
  ];
};

export const getPractice = async (req, res, next) => {
  try {
    const kit = await getOwnedKit(req.params.kitId, req.user.id);

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: "Kit not found",
      });
    }

    const progress = await PracticeProgress.find({
      user_id: req.user.id,
      kit_id: kit._id,
    }).lean();
    const progressByItem = new Map(
      progress.map((entry) => [entry.item_id, entry])
    );

    const items = sortPracticeItems(
      getPracticeItems(kit).map((item) => ({
        ...item,
        confidence: progressByItem.get(item.item_id)?.confidence || null,
        updatedAt: progressByItem.get(item.item_id)?.updatedAt || null,
      }))
    );

    res.status(200).json({
      success: true,
      data: {
        kit_id: kit._id,
        items,
        weak_spots: items.filter((item) => item.confidence !== 3).slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const savePracticeConfidence = async (req, res, next) => {
  try {
    const { kitId, itemId } = req.params;
    const { confidence } = req.body;
    const kit = await getOwnedKit(kitId, req.user.id);

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: "Kit not found",
      });
    }

    if (!/^[qf]\d+$/.test(itemId) || ![1, 2, 3].includes(confidence)) {
      return res.status(400).json({
        success: false,
        message: "Item ID or confidence is invalid",
      });
    }

    const itemExists = getPracticeItems(kit).some(
      (item) => item.item_id === itemId
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Practice item not found",
      });
    }

    const progress = await PracticeProgress.findOneAndUpdate(
      {
        user_id: req.user.id,
        kit_id: kit._id,
        item_id: itemId,
      },
      { confidence },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};
