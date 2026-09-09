import { validateExternalUrl } from "../../utils/url.js";
import { crawlSite } from "./crawler.js";
import { rankLinks } from "./linkRanker.js";
import { generateCompanyBrief } from "../generation/companyBriefGenerator.js";
import { extractPagesContent } from "./pageExtractor.js";

export const researchCompany = async (companyUrl) => {
  // 1. Validate the user-provided URL
  await validateExternalUrl(companyUrl);

  // 2. Crawl homepage only
  const homepagePages = await crawlSite(companyUrl, 1);

  if (!homepagePages || homepagePages.length === 0) {
    throw new Error("Unable to retrieve company website");
  }

  // 3. Get the homepage
  const homepage = homepagePages[0];

  // 4. Rank only same-domain internal links
  const rankedLinks = rankLinks(homepage.internalLinks);

  // 5. Select top relevant pages
  const selectedLinks = rankedLinks
    .filter((link) => link.score > 0)
    .slice(0, 5);

  // 6. Crawl selected pages
  const selectedPages = [];

  for (const link of selectedLinks) {
    try {
      const pages = await crawlSite(link.href, 1);

      if (pages.length > 0) {
        selectedPages.push(pages[0]);
      }
    } catch (error) {
      console.error(`Could not retrieve ${link.href}:`, error.message);
    }
  }

  // 7. Combine all crawled pages
  const allPages = [...homepagePages, ...selectedPages];

  // 8. Clean/extract useful page content
  const cleanPages = extractPagesContent(allPages);
  const companyBrief = await generateCompanyBrief(cleanPages);
  // 9. Identify pages that failed
  const failedLinks = selectedLinks
    .filter((link) => !selectedPages.some((page) => page.url === link.href))
    .map((link) => link.href);

  return {
    startUrl: companyUrl,
    pages: cleanPages,
    discoveredLinks: rankedLinks,
    selectedLinks,
    failedLinks,
    companyBrief,
  };
};
