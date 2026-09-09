import app from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./config/db.js";

async function startServer() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

startServer();