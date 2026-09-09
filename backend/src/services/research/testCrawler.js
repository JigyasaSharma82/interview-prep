import { crawlPage } from "./crawler.js";

const result = await crawlPage("https://example.com");

console.log("\n===== CRAWL RESULT =====\n");

console.log("URL:", result.url);
console.log("TITLE:", result.title);

console.log("\nHEADINGS:");
console.log(result.headings);

console.log("\nTEXT:");
console.log(result.text);

console.log("\nLINKS:");
console.log(result.links);

console.log("\nINTERNAL LINKS:");
console.log(result.internalLinks);