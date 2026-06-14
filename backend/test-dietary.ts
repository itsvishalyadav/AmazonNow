import "dotenv/config";
import { initCatalog, all } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const eggs = all().find(p => p.name.includes('Farm Fresh Eggs'));
  
  console.log('Eggs dietary tags:', eggs?.dietary);
  console.log('Eggs tags:', eggs?.tags);
}
run().catch(console.error);
