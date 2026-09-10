import { validateExternalUrl } from "../../utils/url.js";
import { crawlSite } from "./crawler.js";
import { rankLinks } from "./linkRanker.js";
import { generateCompanyBrief } from "../generation/companyBriefGenerator.js";
import { extractPagesContent } from "./pageExtractor.js";
import { researchPublicInterviewProcess } from "./publicResearch.js";

const withTimeout = (promise, milliseconds, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), milliseconds)
    ),
  ]);

export const researchCompany = async (companyUrl) => {
  console.log("🔍 RESEARCH STARTED:", companyUrl);

  // 1. Validate the user-provided URL
  await validateExternalUrl(companyUrl);

  console.log("🌐 URL VALIDATION FINISHED");

  // 2. Crawl homepage only
  console.log("🌐 ABOUT TO CRAWL HOMEPAGE:", companyUrl);

  const homepagePages = await withTimeout(
    crawlSite(companyUrl, 1),
    25_000,
    "Company homepage research timed out"
  );

  console.log(
    "✅ HOMEPAGE CRAWL FINISHED:",
    homepagePages?.length || 0,
    "pages"
  );

  if (!homepagePages || homepagePages.length === 0) {
    throw new Error("Unable to retrieve company website");
  }

  // 3. Get the homepage
  const homepage = homepagePages[0];

  console.log("🏠 HOMEPAGE RECEIVED:", homepage.url);

  // 4. Rank only same-domain internal links
  const rankedLinks = rankLinks(homepage.internalLinks);

  console.log(
    "🔗 INTERNAL LINKS FOUND:",
    homepage.internalLinks?.length || 0
  );

  console.log(
    "📊 RANKED LINKS:",
    rankedLinks.length
  );

  // 5. Select top relevant pages
  const selectedLinks = rankedLinks
    .filter((link) => link.score > 0)
    .slice(0, 3);

  console.log(
    "🎯 SELECTED RESEARCH LINKS:",
    selectedLinks.map((link) => link.href)
  );

  // 6. Crawl selected pages
  const selectedPages = [];

  await Promise.all(
    selectedLinks.map(async (link) => {
      try {
        console.log("🌐 CRAWLING RESEARCH PAGE:", link.href);
        await validateExternalUrl(link.href);

        const pages = await withTimeout(
          crawlSite(link.href, 1),
          20_000,
          "Research page timed out"
        );

        console.log(
          "✅ RESEARCH PAGE CRAWL FINISHED:",
          link.href,
          pages?.length || 0,
          "pages"
        );

        if (pages.length > 0) {
          selectedPages.push(pages[0]);
        }
      } catch (error) {
        console.error(
          `❌ Could not retrieve ${link.href}:`,
          error.message
        );
      }
    })
  );

  const publicInterviewResearch =
    await researchPublicInterviewProcess(companyUrl);

  // 7. Combine all crawled pages
  const allPages = [
    ...homepagePages,
    ...selectedPages,
    ...publicInterviewResearch.pages,
  ];

  console.log(
    "📚 TOTAL CRAWLED PAGES:",
    allPages.length
  );

  // 8. Clean/extract useful page content
  const cleanPages = extractPagesContent(allPages);

  console.log(
    "🧹 PAGE CONTENT EXTRACTED:",
    cleanPages.length,
    "pages"
  );

  console.log("🤖 GENERATING COMPANY BRIEF...");

  const companyBrief = await withTimeout(
    generateCompanyBrief(cleanPages),
    60_000,
    "Company brief generation timed out"
  );

  console.log("✅ COMPANY BRIEF GENERATED");

  // 9. Identify pages that failed
  const failedLinks = selectedLinks
    .filter(
      (link) =>
        !selectedPages.some((page) => page.url === link.href)
    )
    .map((link) => link.href);

  console.log(
    "⚠️ FAILED LINKS:",
    failedLinks
  );

  console.log("✅ RESEARCH COMPLETED");

  return {
    startUrl: companyUrl,
    pages: cleanPages,
    discoveredLinks: rankedLinks,
    selectedLinks,
    failedLinks,
    companyBrief,
    publicInterviewResearch: {
      sources: publicInterviewResearch.sources,
      unavailable: publicInterviewResearch.unavailable,
    },
  };
};