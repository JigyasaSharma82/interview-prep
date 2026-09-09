export const normalizeUrl = (url, baseUrl) => {
  try {
    const absoluteUrl = new URL(url, baseUrl);

    // Only HTTP/HTTPS URLs
    if (!["http:", "https:"].includes(absoluteUrl.protocol)) {
      return null;
    }

    // Remove hash
    absoluteUrl.hash = "";

    return absoluteUrl.href;
  } catch {
    return null;
  }
};

export const isSameDomain = (url, baseUrl) => {
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);

    return target.hostname === base.hostname;
  } catch {
    return false;
  }
};

export const getValidInternalLinks = (links, baseUrl) => {
  const uniqueUrls = new Set();

  for (const link of links) {
    const normalizedUrl = normalizeUrl(link.href, baseUrl);

    if (!normalizedUrl) {
      continue;
    }

    if (!isSameDomain(normalizedUrl, baseUrl)) {
      continue;
    }

    uniqueUrls.add(normalizedUrl);
  }

  return Array.from(uniqueUrls);
};