import { rankLinks } from "./linkRanker.js";

const links = [
  {
    text: "Careers",
    href: "https://company.com/careers",
  },
  {
    text: "About Us",
    href: "https://company.com/about",
  },
  {
    text: "Engineering",
    href: "https://company.com/engineering",
  },
  {
    text: "Blog",
    href: "https://company.com/blog",
  },
  {
    text: "Privacy Policy",
    href: "https://company.com/privacy",
  },
];

const rankedLinks = rankLinks(links);

console.log("\n===== RANKED LINKS =====\n");
console.log(rankedLinks);