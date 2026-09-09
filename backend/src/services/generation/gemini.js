import { GoogleGenAI } from "@google/genai";
import env from "../../config/env.js";
import { retry } from "../../utils/retry.js";

if (!env.geminiApiKey){
  throw new Error("GEMINI_API_KEY is not configured");
}

export const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

export const model = env.geminiModel;

const isTransientGeminiError = (error) => {
  const status = error?.status || error?.statusCode;
  const code = error?.code;

  return (
    status === 429 ||
    status >= 500 ||
    ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(code)
  );
};

export const generateContentWithRetry = (request) =>
  retry(() => ai.models.generateContent(request), {
    retries: 3,
    baseDelayMs: 500,
    maxDelayMs: 8000,
    shouldRetry: isTransientGeminiError,
  });