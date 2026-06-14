import "dotenv/config";
import { buildCart } from "./src/agent/nowAgent.js";
import { initCatalog } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const res = await buildCart({ userId: "u123", text: "Farm Fresh Eggs 6pc, Green Chillies 100g" });
  console.log(JSON.stringify(res, null, 2));
}
run().catch(console.error);
