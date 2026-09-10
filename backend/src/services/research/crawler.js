import { CheerioCrawler } from "crawlee";
import { getValidInternalLinks } from "../utils/url.js";

export const crawlSite = async (startUrl, maxRequests = 10) => {
  const pages = [];

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: maxRequests,

    // Don't send too many requests too quickly
    maxConcurrency: 2,

    // Wait before retrying a failed request
    minConcurrency: 1,

    requestHandlerTimeoutSecs: 15,

    // Crawlee retries failed requests automatically
    maxRequestRetries: 1,

    // Respect robots.txt
    respectRobotsTxtFile: true,

    async requestHandler({ $, request, response }) {
      const contentType = response?.headers?.["content-type"] || "";
      const contentLength = Number(response?.headers?.["content-length"] || 0);

      if (contentType && !contentType.includes("text/html")) {
        throw new Error("Unsupported company page content type");
      }

      if (contentLength > 2_000_000) {
        throw new Error("Company page response is too large");
      }

      const title = $("title").text().trim();

      const headings = $("h1, h2, h3")
        .map((_, element) => $(element).text().trim())
        .get()
        .filter(Boolean);

      const text = $("body")
        .text()
        .replace(/\s+/g, " ")
        .trim();

      const links = $("a[href]")
        .map((_, element) => ({
          text: $(element).text().trim(),
          href: $(element).attr("href"),
        }))
        .get()
        .filter((link) => link.href);

      const internalLinks = getValidInternalLinks(
        links,
        request.url
      );

      pages.push({
        url: request.url,
        title,
        headings,
        text,
        links,
        internalLinks,
      });
    },

    failedRequestHandler({ request, error }) {
      console.error(
        `Failed to crawl ${request.url}:`,
        error?.message || "Unknown error"
      );
    },
  });

  await crawler.run([startUrl]);

  return pages;
};