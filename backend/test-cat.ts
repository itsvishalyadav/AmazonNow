import "dotenv/config";
import { initCatalog, all } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const eggs = all().find(p => p.name.includes('Farm Fresh Eggs'));
  const chillies = all().find(p => p.name.includes('Green Chillies'));
  
  console.log('Eggs category:', eggs?.category);
  console.log('Chillies category:', chillies?.category);
}
run().catch(console.error);
