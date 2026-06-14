import "dotenv/config";
import { search } from "./src/services/vectorSearch.js";
import { initCatalog, all } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  
  const searchResults = await search("farm fresh eggs", { dietary: ["vegetarian"] }, 10);
  console.log("Search results for 'farm fresh eggs' with vegetarian constraint:");
  for (const r of searchResults) {
    console.log(`- ${r.name}: ${r._score}`);
  }
}
run().catch(console.error);
