import "dotenv/config";
import { search } from "./src/services/vectorSearch.js";
import { initCatalog, all } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const eggs = await search("farm fresh eggs", { dietary: [] }, 5);
  console.log("EGGS SCORES:\n" + eggs.map(e => e.name + " : " + e._score).join('\n'));
  
  const allEggs = all().filter(p => p.name.toLowerCase().includes("egg"));
  console.log("\nActual Eggs in DB:\n" + allEggs.map(e => e.name).join('\n'));
}
run().catch(console.error);
