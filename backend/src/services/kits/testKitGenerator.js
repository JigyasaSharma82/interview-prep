import { generateKit } from "./kitGenerator.js";

const jd = `
Backend Developer

We are looking for a backend developer.

Responsibilities:
- Build and maintain backend APIs
- Work with the frontend team

Requirements:
- 3+ years of experience with Node.js
- Experience with MongoDB
- Strong understanding of REST APIs
- Good communication skills
`;

try {
  const kit = await generateKit({
    jd,
    company_url: "https://example.com",
    days: 5,
  });

  console.log(
    JSON.stringify(kit, null, 2)
  );
} catch (error) {
  console.error(error);
}