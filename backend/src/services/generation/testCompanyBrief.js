import { generateCompanyBrief } from "./companyBriefGenerator.js";

const pages = [
  {
    url: "https://example.com",
    title: "Example Company",
    headings: ["About Example Company"],
    text: `
      Example Company builds software tools for small businesses.
      The company provides cloud-based workflow management products.
    `,
  },
];

try {
  const result = await generateCompanyBrief(pages);

  console.log("\n===== COMPANY BRIEF =====\n");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("\n===== ERROR =====\n");
  console.error(error);
}