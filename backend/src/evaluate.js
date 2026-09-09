import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const evaluate = async (cases) => {
  const results = [];

  if (cases.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      results,
    };
  }

  const { generateKit } = await import(
    "./services/kits/kitGenerator.js"
  );

  for (const [index, testCase] of cases.entries()) {
    try {
      const kit = await generateKit({
        jd: testCase.jd,
        company_url: testCase.company_url,
        days: testCase.days,
      });

      results.push({
        index,
        passed: true,
        requirements: kit.role.requirements.length,
        questions: kit.questions.length,
        flashcards: kit.flashcards.length,
      });
    } catch (error) {
      results.push({
        index,
        passed: false,
        error: error.message || "Evaluation failed",
      });
    }
  }

  return {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };
};

const run = async () => {
  const currentFile = fileURLToPath(import.meta.url);
  const casesPath = path.resolve(
    path.dirname(currentFile),
    "../../cases/sample-cases.json"
  );
  const cases = JSON.parse(await fs.readFile(casesPath, "utf8"));
  const report = await evaluate(cases);

  console.log(JSON.stringify(report, null, 2));

  if (report.failed > 0) {
    process.exitCode = 1;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
}
