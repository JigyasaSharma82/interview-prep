import { generateQuestions } from "./questionGenerator.js";

const requirements = [
  {
    id: "r1",
    text: "3+ years of experience with Node.js",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r2",
    text: "Experience with MongoDB",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r3",
    text: "Strong understanding of REST APIs",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r4",
    text: "Good communication skills",
    kind: "behavioral",
    priority: "must",
  },
];

try {
  const result = await generateQuestions(requirements);

  console.log(
    JSON.stringify(result, null, 2)
  );
} catch (error) {
  console.error(error);
}