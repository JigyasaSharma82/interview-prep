import Kit from "../models/Kit.js";

export const createKit = async (req, res, next) => {
  try {
    const { jd, company_url, days } = req.body;

    const kit = await Kit.create({
      user_id: req.user.id,

      source: {
        company_url,
        jd_chars: jd.length,
      },

      schedule: {
        days_available: days,
        days: [],
      },

      coverage: {
        uncovered_requirement_ids: [],
        passes: 0,
      },
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