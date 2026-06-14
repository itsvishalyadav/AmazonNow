import "dotenv/config";
import { search } from "./src/services/vectorSearch.js";
import { initCatalog } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const eggs = await search("farm fresh eggs", { dietary: [] }, 8);
  console.log("EGGS CANDIDATES:\n" + eggs.map(e => e.name).join('\n'));
  
  const chillies = await search("green chillies", { dietary: [] }, 8);
  console.log("\nCHILLIES CANDIDATES:\n" + chillies.map(c => c.name).join('\n'));
}
run().catch(console.error);
