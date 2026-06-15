import { initCatalog } from "./src/services/catalog.js";
import { search } from "./src/services/vectorSearch.js";

async function main() {
  await initCatalog();
  
  const queries = [
    "iphone",
    "travel pillow",
    "mixer grinder",
    "birthday cake",
    "charger",
    "headphones"
  ];
  
  for (const q of queries) {
    console.log(`\n--- Vector Search for: "${q}" ---`);
    const results = await search(q, {}, 5);
    if (results.length === 0) {
      console.log("No results returned! (Filtered by MIN_SIMILARITY?)");
    } else {
      results.forEach(r => {
        console.log(`[Score: ${(r as any)._score.toFixed(3)}] ${r.name}`);
      });
    }
  }
}

main().catch(console.error);
