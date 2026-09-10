import {
  generateQuestions,
  generateQuestionsForRequirements,
} from "../generation/questionGenerator.js";
import { researchCompany } from "../research/research.service.js";
import { allocateSchedule } from "../scheduling/scheduleAllocator.js";
import { checkCoverage } from "../coverage/coverageChecker.js";
import { validateCompleteKit } from "./kitValidator.js";
import {
  normalizeGeneratedQuestion,
  validateCanonicalQuestion,
} from "./questionNormalizer.js";

const protectedItem = (item) =>
  item.content_state?.is_pinned ||
  item.content_state?.origin === "edited" ||
  item.content_state?.origin === "handwritten";

const normalizePrompt = (prompt) =>
  String(prompt || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const nextQuestionNumber = (questions) =>
  questions.reduce((highest, question) => {
    const number = Number(/^q(\d+)$/.exec(question.id || "")?.[1] || 0);
    return Math.max(highest, number);
  }, 0) + 1;

const toQuestion = (question, id) => ({
  ...question,
  id,
  content_state: { origin: "generated", is_pinned: false },
});

export const collectFreshCanonicalQuestions = async ({
  targetCount,
  existingPrompts,
  requirements,
  fetchRawQuestions,
}) => {
  const newCanonicalQuestions = [];
  const seenPrompts = new Set(existingPrompts.map(normalizePrompt));
  let duplicateCount = 0;

  for (let attempt = 1; attempt <= 3 && newCanonicalQuestions.length < targetCount; attempt += 1) {
    const remaining = targetCount - newCanonicalQuestions.length;
    console.log("[REGENERATE] attempt", attempt);
    const rawQuestions = await fetchRawQuestions({
      attempt,
      requestedCount: remaining,
      avoidQuestions: [...seenPrompts],
    });
    console.log("[REGENERATE] raw LLM questions:", rawQuestions.length);

    const normalizedQuestions = rawQuestions.map((question, index) => {
      console.log("[NORMALIZER INPUT]", JSON.stringify(question, null, 2));
      return normalizeGeneratedQuestion(
        question,
        requirements,
        `Regenerated question ${index + 1}`
      );
    });
    console.log("[REGENERATE] normalized questions:", normalizedQuestions.length);

    for (const question of normalizedQuestions) {
      const prompt = normalizePrompt(question.prompt);
      if (!prompt || seenPrompts.has(prompt)) {
        duplicateCount += 1;
        continue;
      }
      seenPrompts.add(prompt);
      newCanonicalQuestions.push(question);
    }

    console.log("[REGENERATE] duplicates:", duplicateCount);
    console.log("[REGENERATE] remaining replacement count:", targetCount - newCanonicalQuestions.length);
  }

  return { newCanonicalQuestions, duplicateCount };
};

export const mergeQuestionsForCategory = (
  existingQuestions,
  generatedQuestions,
  category,
  requirements
) => {
  const preserved = existingQuestions.filter(
    (question) => question.category !== category || protectedItem(question)
  );
  const usedIds = new Set(preserved.map((question) => question.id));
  const usedPrompts = new Set(
    existingQuestions.map((question) => normalizePrompt(question.prompt))
  );
  let nextNumber = nextQuestionNumber(existingQuestions);
  const replacementQuestions = generatedQuestions
    .filter((question) => question.category === category)
    .filter((question) => {
      const normalized = normalizePrompt(question.prompt);
      if (!normalized || usedPrompts.has(normalized)) return false;
      usedPrompts.add(normalized);
      return true;
    })
    .map((question) =>
      validateCanonicalQuestion(question, requirements, "Regenerated question")
    )
    .map((question) => {
      while (usedIds.has(`q${nextNumber}`)) nextNumber += 1;
      const id = `q${nextNumber}`;
      usedIds.add(id);
      nextNumber += 1;
      return toQuestion(question, id);
    });

  return [...preserved, ...replacementQuestions];
};

export const regenerateQuestionsForCategory = async (kit, category) => {
  const requirements = kit.role.requirements;
  const existingQuestions = kit.questions.map((question) =>
    typeof question.toObject === "function" ? question.toObject() : question
  );
  const eligibleQuestions = existingQuestions.filter(
    (question) => question.category === category && !protectedItem(question)
  );
  const protectedQuestions = existingQuestions.filter(protectedItem);
  console.log("[REGENERATE] category:", category);
  console.log("[REGENERATE] existing generated questions:", eligibleQuestions.length);
  console.log("[REGENERATE] protected questions:", protectedQuestions.length);

  if (eligibleQuestions.length === 0) {
    console.log("[REGENERATE] no eligible generated questions; preserving kit");
    return validateCompleteKit(kit.toObject());
  }

  const existingPrompts = existingQuestions.map((question) => question.prompt);
  const targetCount = eligibleQuestions.length;
  const { newCanonicalQuestions, duplicateCount } =
    await collectFreshCanonicalQuestions({
      targetCount,
      existingPrompts,
      requirements,
      fetchRawQuestions: async ({ requestedCount, avoidQuestions }) => {
        const generated = await generateQuestions(
          requirements,
          "",
          category,
          { requestedCount, avoidQuestions }
        );
        console.log("[RAW LLM OUTPUT]", JSON.stringify(generated.questions, null, 2));
        return generated.questions;
      },
    });

  console.log("[REGENERATE] generated:", newCanonicalQuestions.length);
  console.log("[REGENERATE] duplicates removed:", duplicateCount);
  if (newCanonicalQuestions.length < targetCount) {
    throw new Error("Unable to generate enough fresh, non-duplicate questions");
  }

  const questions = mergeQuestionsForCategory(
    existingQuestions,
    newCanonicalQuestions,
    category,
    requirements
  );
  console.log("[REGENERATE] final new questions:", newCanonicalQuestions.length);
  const usedIds = new Set(questions.map((question) => question.id));
  let nextNumber = 1;
  const coverage = checkCoverage(requirements, questions);

  if (coverage.uncovered_requirement_ids.length > 0) {
    const uncovered = requirements.filter((requirement) =>
      coverage.uncovered_requirement_ids.includes(requirement.id)
    );
    const additional = await generateQuestionsForRequirements(
      uncovered,
      category,
      { avoidQuestions: existingPrompts.concat(questions.map((question) => question.prompt)) }
    );
    for (const question of additional.questions) {
      if (questions.some((item) => normalizePrompt(item.prompt) === normalizePrompt(question.prompt))) {
        continue;
      }
      const nextQuestion = toQuestion(
        normalizeGeneratedQuestion(
          question,
          requirements,
          "Regenerated coverage question"
        ),
        ""
      );
      while (usedIds.has(`q${nextNumber}`)) nextNumber += 1;
      nextQuestion.id = `q${nextNumber}`;
      questions.push(nextQuestion);
      usedIds.add(`q${nextNumber}`);
      nextNumber += 1;
    }
  }

  const finalCoverage = checkCoverage(requirements, questions);
  if (finalCoverage.uncovered_requirement_ids.length > 0) {
    throw new Error(
      `Category regeneration would leave uncovered must-have requirements: ${finalCoverage.uncovered_requirement_ids.join(", ")}`
    );
  }

  console.log("[REGENERATE] coverage check passed");

  return validateCompleteKit({
    ...kit.toObject(),
    questions,
    schedule: allocateSchedule(requirements, questions, kit.schedule.days_available),
    coverage: {
      uncovered_requirement_ids: finalCoverage.uncovered_requirement_ids,
      passes: kit.coverage.passes,
    },
  });
};

export const regenerateCompanyBrief = async (kit) => {
  const research = await researchCompany(kit.source.company_url);
  const nextBrief = {
    summary: research.companyBrief.summary,
    what_they_do: research.companyBrief.what_they_do,
    interview_process: research.companyBrief.interview_process,
    sources: research.pages.map((page) => page.url),
    content_state: { origin: "generated", is_pinned: false },
  };

  if (protectedItem(kit.company_brief)) {
    return kit.toObject();
  }

  return validateCompleteKit({
    ...kit.toObject(),
    company_brief: nextBrief,
  });
};

export const regenerateSchedule = (kit) => {
  const kitObject = kit.toObject();
  const coverage = checkCoverage(kit.role.requirements, kit.questions);
  if (coverage.uncovered_requirement_ids.length > 0) {
    throw new Error(
      `Cannot regenerate schedule with uncovered must-have requirements: ${coverage.uncovered_requirement_ids.join(", ")}`
    );
  }

  return validateCompleteKit({
    ...kitObject,
    schedule: allocateSchedule(
      kit.role.requirements,
      kit.questions,
      kit.schedule.days_available
    ),
    coverage: {
      ...kit.coverage,
      uncovered_requirement_ids: coverage.uncovered_requirement_ids,
    },
  });
};
