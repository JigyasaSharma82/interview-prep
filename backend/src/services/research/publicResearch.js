import { validateExternalUrl } from "../../utils/url.js";

const SEARCH_TIMEOUT_MS = 10_000;
const MAX_SEARCH_BYTES = 500_000;
const MAX_DISCUSSION_RESULTS = 3;

const fetchText = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "AI-Interview-Prep-Research/1.0" },
    });

    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return "";

    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > MAX_SEARCH_BYTES) return "";

    const text = await response.text();
    return text.slice(0, MAX_SEARCH_BYTES);
  } finally {
    clearTimeout(timeoutId);
  }
};

const decodeHtml = (value) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const researchPublicInterviewProcess = async (companyUrl) => {
  const company = new URL(companyUrl).hostname.replace(/^www\./, "");
  const query = encodeURIComponent(
    `"${company}" interview process hiring assessment candidate experience`
  );
  const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;

  try {
    const html = await fetchText(searchUrl);
    const candidates = [];
    const resultPattern = /result__a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = resultPattern.exec(html)) && candidates.length < MAX_DISCUSSION_RESULTS) {
      const href = match[1];
      try {
        await validateExternalUrl(href);
        candidates.push({
          url: href,
          title: decodeHtml(match[2]),
        });
      } catch {
        // Search results are untrusted and may point at private destinations.
      }
    }

    const pages = [];
    for (const candidate of candidates) {
      try {
        const pageHtml = await fetchText(candidate.url);
        const text = decodeHtml(pageHtml);
        if (text) {
          pages.push({
            url: candidate.url,
            title: candidate.title,
            headings: [],
            text,
            internalLinks: [],
            research_type: "public_interview_discussion",
          });
        }
      } catch (error) {
        console.error("Public interview source unavailable:", error.message);
      }
    }

    return {
      pages,
      sources: pages.map((page) => page.url),
      unavailable: pages.length === 0,
    };
  } catch (error) {
    console.error("Public interview research unavailable:", error.message);
    return { pages: [], sources: [], unavailable: true };
  }
};
