import app from "./app.js";
import env, { validateEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function startServer() {
  validateEnv();
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

startServer();