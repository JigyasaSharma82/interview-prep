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

  for (const [index, testCase] of cases.entries()) {
    try {
      const { generateKit } = await import(
        "./services/kits/kitGenerator.js"
      );
      const kit = await generateKit({
        jd: testCase.jd,
        company_url: testCase.company_url,
        days: testCase.days,
      });

      results.push({
        index,
        status: "ok",
        passed: true,
        kit,
        requirements: kit.role.requirements.length,
        questions: kit.questions.length,
        flashcards: kit.flashcards.length,
      });
    } catch (error) {
      results.push({
        index,
        status: "failed",
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
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");
  const outputIndex = args.indexOf("--output");
  const defaultInput = path.resolve(
    path.dirname(currentFile),
    "../../cases/sample-cases.json"
  );
  const casesPath = inputIndex >= 0 ? path.resolve(args[inputIndex + 1]) : defaultInput;
  const outputPath = outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : null;
  const cases = JSON.parse(await fs.readFile(casesPath, "utf8"));
  const report = await evaluate(cases);

  const output = JSON.stringify(report, null, 2);
  if (outputPath) await fs.writeFile(outputPath, output, "utf8");
  console.log(output);

  if (report.failed > 0) {
    process.exitCode = 1;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
}
