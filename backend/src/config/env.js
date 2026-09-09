import "dotenv/config";

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodbUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,

  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

export const validateEnv = () => {
  const required = [
    ["MONGODB_URI", env.mongodbUri],
    ["JWT_SECRET", env.jwtSecret],
  ];
  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

export default env;