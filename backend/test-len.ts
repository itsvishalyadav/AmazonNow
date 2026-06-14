import "dotenv/config";
import { initCatalog, all } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const poncho = all().find(p => p.name === 'Rain Poncho');
  console.log("Poncho embedding length:", poncho?.embedding?.length);
}
run().catch(console.error);
