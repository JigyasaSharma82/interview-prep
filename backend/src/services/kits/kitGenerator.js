import { extractRequirements } from "../generation/requirementExtractor.js";
import { researchCompany } from "../research/research.service.js";
import { checkCoverage } from "../coverage/coverageChecker.js";
import {
  generateQuestions,
  generateQuestionsForRequirements,
} from "../generation/questionGenerator.js";
import { generateFlashcards } from "../generation/flashcardGenerator.js";
import { allocateSchedule } from "../scheduling/scheduleAllocator.js";
import { validateCompleteKit } from "./kitValidator.js";
import { GenerationError } from "../../utils/errors.js";
import { normalizeGeneratedQuestion } from "./questionNormalizer.js";

export const generateKit = async ({
  jd,
  company_url,
  days,
  onStage = async () => {},
}) => {
  const runStage = async (stage, operation) => {
    await onStage(stage);
    console.log(`STAGE: ${stage}`);

    try {
      const result = await operation();
      console.log(`STAGE COMPLETED: ${stage}`);
      return result;
    } catch (error) {
      if (error instanceof GenerationError) {
        throw error;
      }

      throw new GenerationError(stage, error.message, {
        cause: error,
      });
    }
  };

  // 1. Extract requirements from JD
  const role = await runStage("requirements", () =>
    extractRequirements(jd)
  );

  // 2. Research company
  const research = await runStage("research", () =>
    researchCompany(company_url)
  );

  // 3. Generate initial questions
  const researchContext = research.pages
    .map((page) => `${page.url}\n${page.text.slice(0, 2000)}`)
    .join("\n\n")
    .slice(0, 12000);

  const generated = await runStage("questions", () =>
    generateQuestions(role.requirements, researchContext)
  );

  // 4. Normalize questions and assign stable IDs
  let questions = generated.questions.map(
    (question, index) => ({
      id: `q${index + 1}`,
      ...(() => {
        console.log(
          "[QUESTION GENERATION] generated question: requirement_id =",
          question.requirement_id
        );
        return {};
      })(),
      ...normalizeGeneratedQuestion(
        question,
        role.requirements,
        `Generated question q${index + 1}`
      ),
    })
  );

  // 5. Check initial coverage
  let coverage = checkCoverage(
    role.requirements,
    questions
  );

  let passes = 1;

  // 6. Generate additional questions for
  // uncovered must-have requirements
  while (
    coverage.uncovered_requirement_ids.length > 0 &&
    passes < 3
  ) {
    const uncoveredRequirements =
      role.requirements.filter((requirement) =>
        coverage.uncovered_requirement_ids.includes(
          requirement.id
        )
      );

    const extraGenerated = await runStage(
      "coverage-questions",
      () => generateQuestionsForRequirements(uncoveredRequirements)
    );

    const nextQuestions =
      extraGenerated.questions.map(
        (question, index) => ({
          id: `q${questions.length + index + 1}`,
          ...normalizeGeneratedQuestion(
            question,
            role.requirements,
            `Generated coverage question ${questions.length + index + 1}`
          ),
        })
      );

    questions.push(...nextQuestions);

    // Check coverage again
    coverage = checkCoverage(
      role.requirements,
      questions
    );

    passes++;
  }

  // 7. Do not allow an incomplete kit
  if (
    coverage.uncovered_requirement_ids.length > 0
  ) {
    throw new GenerationError(
      "coverage",
      `Unable to cover must-have requirements: ${coverage.uncovered_requirement_ids.join(
        ", "
      )}`
    );
  }

  // 8. Generate flashcards
  const generatedFlashcards = await runStage(
    "flashcards",
    () => generateFlashcards(role.requirements)
  );

  const flashcards =
    generatedFlashcards.flashcards.map(
      (flashcard, index) => ({
        id: `f${index + 1}`,
        front: flashcard.front,
        back: flashcard.back,
        requirement_ids: [
          flashcard.requirement_id,
        ],
      })
    );

  // 9. Allocate deterministic schedule
  const schedule = await runStage("schedule", () =>
    allocateSchedule(role.requirements, questions, days)
  );

  // 10. Build complete kit
  const kit = {
    source: {
      company: "",
      company_url,
      role: role.title,
      location: "",
      jd_chars: jd.length,
      researched_at:
        new Date().toISOString(),
      pages_used: research.pages.map(
        (page) => page.url
      ),
    },

    company_brief: {
      summary:
        research.companyBrief.summary,
      what_they_do:
        research.companyBrief.what_they_do,
      interview_process:
        research.companyBrief.interview_process,
      sources: research.pages.map(
        (page) => page.url
      ),
    },

    role: {
      title: role.title,
      seniority: role.seniority,
      responsibilities:
        role.responsibilities,
      requirements: role.requirements,
    },

    questions,

    flashcards,

    schedule,

    coverage: {
      uncovered_requirement_ids:
        coverage.uncovered_requirement_ids,
      passes,
    },
  };

  // 11. Validate the complete kit
  const validatedKit = await runStage("validation", () =>
    validateCompleteKit(kit)
  );

  return validatedKit;
};