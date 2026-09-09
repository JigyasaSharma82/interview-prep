import { extractRequirements } from "../generation/requirementExtractor.js";
import { researchCompany } from "../research/research.service.js";

export const generateKit = async ({ jd, company_url, days }) => {
  // Step 1: Extract requirements from JD
  const role = await extractRequirements(jd);

  // Step 2: Research company
  const research = await researchCompany(company_url);

  return {
    source: {
      company: "",
      company_url,
      role: role.title,
      location: "",
      jd_chars: jd.length,
      researched_at: new Date().toISOString(),
      pages_used: research.pages.map((page) => page.url),
    },

    company_brief: {
      summary: research.companyBrief.summary,
      what_they_do: research.companyBrief.what_they_do,
      sources: research.pages.map((page) => page.url),
    },

    role: {
      title: role.title,
      seniority: role.seniority,
      responsibilities: role.responsibilities,
      requirements: role.requirements,
    },

    questions: [],

    flashcards: [],

    schedule: {
      days_available: days,
      days: [],
    },

    coverage: {
      uncovered_requirement_ids: [],
      passes: 0,
    },
  };
};