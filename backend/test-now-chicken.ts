import "dotenv/config";
import { buildCart } from "./src/agent/nowAgent.js";
import { initCatalog } from "./src/services/catalog.js";
import { updateLearnedPrefs } from "./src/services/userContext.js";

async function run() {
  await initCatalog();
  const res = await buildCart({ userId: "u123", text: "chicken curry" });
  console.log(JSON.stringify(res, null, 2));
}
run().catch(console.error);
