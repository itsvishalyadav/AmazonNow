import "dotenv/config";
import { all, initCatalog } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const items = all().filter(p => p.dietary.includes('non-vegetarian'));
  console.log("Non-veg items in catalog:");
  for (const c of items) {
    console.log(c.name, c.category);
  }
}
run().catch(console.error);
