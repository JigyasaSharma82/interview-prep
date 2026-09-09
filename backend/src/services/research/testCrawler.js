import { crawlSite } from "./crawler.js";

const pages = await crawlSite("https://example.com");

console.log("\n===== CRAWLED PAGES =====\n");

for (const page of pages) {
  console.log("URL:", page.url);
  console.log("TITLE:", page.title);
  console.log("HEADINGS:", page.headings);
  console.log("-------------------------");
}

console.log("\nTOTAL PAGES:", pages.length);