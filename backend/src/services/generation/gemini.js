import { GoogleGenAI } from "@google/genai";
import env from "../../config/env.js";
import { retry } from "../utils/retry.js";

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
  const message = String(error?.message || "").toLowerCase();
  const isQuotaExhausted =
    code === "RESOURCE_EXHAUSTED" &&
    (message.includes("quota") ||
      message.includes("free_tier") ||
      message.includes("per day"));

  return (
    !isQuotaExhausted &&
    (status === 429 ||
    status >= 500 ||
    ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(code))
  );
};

export const generateContentWithRetry = async (request) => {
  try {
    return await retry(() => ai.models.generateContent(request), {
      retries: 3,
      baseDelayMs: 500,
      maxDelayMs: 8000,
      shouldRetry: isTransientGeminiError,
    });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();

    if (
      error?.code === "RESOURCE_EXHAUSTED" &&
      (message.includes("quota") || message.includes("free_tier"))
    ) {
      throw new Error(
        "Gemini API quota exhausted for this project/model. Check Gemini billing or wait for the quota reset."
      );
    }

    throw error;
  }
};