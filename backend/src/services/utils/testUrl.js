import { validateExternalUrl } from "./url.js";

const urls = [
  "https://example.com",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://192.168.1.10",
];

for (const url of urls) {
  try {
    await validateExternalUrl(url);
    console.log("ALLOWED:", url);
  } catch (error) {
    console.log("BLOCKED:", url, "→", error.message);
  }
}