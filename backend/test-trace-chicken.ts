import "dotenv/config";
import { search } from "./src/services/vectorSearch.js";
import { initCatalog } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const searchResults = await search("chicken", { dietary: ["vegetarian"] }, 10);
  console.log("Search results for 'chicken' with vegetarian constraint:");
  for (const r of searchResults) {
    console.log(`- ${r.name}: ${r._score} (Dietary tags: ${r.dietary})`);
  }
}
run().catch(console.error);
