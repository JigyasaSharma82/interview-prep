import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    kind: {
      type: String,
      enum: ["technical", "behavioral", "domain", "other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["must", "nice"],
      required: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    requirement_ids: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    answer_outline: {
      type: String,
      default: "",
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 3,
      required: true,
    },
  },
  { _id: false }
);

const flashcardSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    requirement_ids: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const scheduleDaySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
    },
    focus: {
      type: String,
      required: true,
    },
    question_ids: {
      type: [String],
      default: [],
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const kitSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    source: {
      company: {
        type: String,
        default: "",
      },
      company_url: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        default: "",
      },
      location: {
        type: String,
        default: "",
      },
      jd_chars: {
        type: Number,
        default: 0,
      },
      researched_at: {
        type: String,
        default: "",
      },
      pages_used: {
        type: [String],
        default: [],
      },
    },

    company_brief: {
      summary: {
        type: String,
        default: "",
      },
      what_they_do: {
        type: String,
        default: "",
      },
      sources: {
        type: [String],
        default: [],
      },
    },

    role: {
      title: {
        type: String,
        default: "",
      },
      seniority: {
        type: String,
        default: "",
      },
      responsibilities: {
        type: [String],
        default: [],
      },
      requirements: {
        type: [requirementSchema],
        default: [],
      },
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    flashcards: {
      type: [flashcardSchema],
      default: [],
    },

    schedule: {
      days_available: {
        type: Number,
        required: true,
      },
      days: {
        type: [scheduleDaySchema],
        default: [],
      },
    },

    coverage: {
      uncovered_requirement_ids: {
        type: [String],
        default: [],
      },
      passes: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Kit = mongoose.model("Kit", kitSchema);

export default Kit;