import "dotenv/config";
import { all, initCatalog } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const chicken = all().filter(p => p.name.toLowerCase().includes('chicken') && p.category !== 'Pet Care');
  console.log("Chicken items in catalog:");
  for (const c of chicken) {
    console.log(c.name);
  }
}
run().catch(console.error);
