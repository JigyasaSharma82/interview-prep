import { researchCompany } from "./research.service.js";

try {
  const result = await researchCompany("https://example.com");

  console.log("\n===== RESEARCH RESULT =====\n");

  console.log("START URL:");
  console.log(result.startUrl);

  console.log("\nDISCOVERED LINKS:");
  console.log(result.discoveredLinks);

  console.log("\nSELECTED LINKS:");
  console.log(result.selectedLinks);

  console.log("\nPAGES CRAWLED:");
  console.log(result.pages.length);
} catch (error) {
  console.error("\n===== RESEARCH ERROR =====\n");
  console.error(error.message);
}