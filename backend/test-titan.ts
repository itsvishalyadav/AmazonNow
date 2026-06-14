import "dotenv/config";
import { embedWithBedrock } from "./src/services/bedrock.js";
import { initCatalog, all } from "./src/services/catalog.js";

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function run() {
  await initCatalog();
  const eggs = all().find(p => p.name === 'Farm Fresh Eggs 6pc');
  
  if (!eggs || !eggs.embedding) {
    console.log("No embedding for eggs");
    return;
  }

  const queryVec = await embedWithBedrock("farm fresh eggs");
  
  console.log("Query 'farm fresh eggs' to catalog embedding similarity:", cosineSim(queryVec, eggs.embedding));
}
run().catch(console.error);
