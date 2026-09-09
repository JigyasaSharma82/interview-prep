const HIGH_VALUE_KEYWORDS = [
  "career",
  "careers",
  "jobs",
  "job",
  "hiring",
  "join-us",
  "join",
  "work-with-us",
  "openings",
  "vacancies",
  "interview",
  "interview-process",
  "hiring-process",
  "assessment",
  "technical-screen",
  "onsite",
  "candidate",
];

const MEDIUM_VALUE_KEYWORDS = [
  "about",
  "company",
  "who-we-are",
  "our-story",
  "mission",
  "values",
  "culture",
  "engineering",
  "technology",
  "team",
];

const LOW_VALUE_KEYWORDS = [
  "blog",
  "news",
  "privacy",
  "terms",
  "cookie",
  "login",
  "signup",
];

export const rankLinks = (links) => {
  return links
    .map((link) => {
      const url = link.href.toLowerCase();
      const text = link.text.toLowerCase();

      let score = 0;

      for (const keyword of HIGH_VALUE_KEYWORDS) {
        if (url.includes(keyword) || text.includes(keyword)) {
          score += 10;
        }
      }

      for (const keyword of MEDIUM_VALUE_KEYWORDS) {
        if (url.includes(keyword) || text.includes(keyword)) {
          score += 5;
        }
      }

      for (const keyword of LOW_VALUE_KEYWORDS) {
        if (url.includes(keyword) || text.includes(keyword)) {
          score -= 5;
        }
      }

      return {
        ...link,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
};