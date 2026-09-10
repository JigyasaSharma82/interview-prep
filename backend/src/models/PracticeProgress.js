import mongoose from "mongoose";

const practiceProgressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kit",
      required: true,
      index: true,
    },
    item_id: {
      type: String,
      required: true,
      match: /^[qf]\d+$/,
    },
    confidence: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
  },
  { timestamps: true }
);

practiceProgressSchema.index(
  { user_id: 1, kit_id: 1, item_id: 1 },
  { unique: true }
);

const PracticeProgress = mongoose.model(
  "PracticeProgress",
  practiceProgressSchema
);

export default PracticeProgress;
