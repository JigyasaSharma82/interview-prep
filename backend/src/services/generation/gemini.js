import { GoogleGenAI } from "@google/genai";
import env from "../../config/env.js";

if (!env.geminiApiKey){
  throw new Error("GEMINI_API_KEY is not configured");
}

export const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

export const model = env.geminiModel;