import { CheerioCrawler } from "crawlee";

export const crawlPage = async (url) => {
  let result = null;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 1,

    async requestHandler({ $, request }) {
      const title = $("title").text().trim();

      const headings = $("h1, h2, h3")
        .map((_, element) => $(element).text().trim())
        .get()
        .filter(Boolean);

      const text = $("body").text().replace(/\s+/g, " ").trim();

      const links = $("a[href]")
        .map((_, element) => ({
          text: $(element).text().trim(),
          href: $(element).attr("href"),
        }))
        .get()
        .filter((link) => link.href);

      result = {
        url: request.url,
        title,
        headings,
        text,
        links,
      };
    },

    failedRequestHandler({ request }) {
      throw new Error(`Failed to crawl: ${request.url}`);
    },
  });

  await crawler.run([url]);

  return result;
};