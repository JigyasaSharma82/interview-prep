import { extractRequirements } from "./requirementExtractor.js";

const jd = `
We are looking for a Backend Developer.

Requirements:
- 3+ years of experience with Node.js
- Experience with MongoDB
- Strong understanding of REST APIs
- Good communication skills

Responsibilities:
- Build and maintain backend APIs
- Work with the frontend team
`;

try {
  const result = await extractRequirements(jd);

  console.log("\n===== EXTRACTED REQUIREMENTS =====\n");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("\n===== ERROR =====\n");
  console.error(error);
}