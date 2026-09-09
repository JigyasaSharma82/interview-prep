import Kit from "../models/Kit.js";
import { generateKit } from "../services/kits/kitGenerator.js";
import { validateCompleteKit } from "../services/kits/kitValidator.js";

export const createKit = async (req, res, next) => {
  try {
    const { jd, company_url, days } = req.body;

    const generatedKit = await generateKit({
      jd,
      company_url,
      days,
    });

    const kit = await Kit.create({
      user_id: req.user.id,
      ...generatedKit,
    });

    res.status(201).json({
      success: true,
      message: "Kit created successfully",
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