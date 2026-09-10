export const extractPageContent = (page) => {
  const MAX_PAGE_TEXT_LENGTH = 20_000;
  const title = page.title?.trim() || "";

  const headings = (page.headings || [])
    .map((heading) => heading.trim())
    .filter(Boolean);

  const text = (page.text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PAGE_TEXT_LENGTH);

  return {
    url: page.url,
    title,
    headings,
    text,
  };
};

export const extractPagesContent = (pages) => {
  return pages
    .map(extractPageContent)
    .filter((page) => page.text.length > 0);
};