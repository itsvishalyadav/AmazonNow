import { initCatalog, all } from "./src/services/catalog.js";
import { embedWithBedrock } from "./src/services/bedrock.js";

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const valA = a[i] || 0;
    const valB = b[i] || 0;
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  await initCatalog();
  const catalog = all();
  
  const queries = ["iphone", "mixer grinder"];
  
  for (const q of queries) {
    console.log(`\n--- Vector Search for: "${q}" ---`);
    const queryVec = await embedWithBedrock(q);
    
    const scored = catalog
      .filter((p) => p.embedding && p.embedding.length > 0)
      .map((p) => ({
        name: p.name,
        score: cosineSim(queryVec, p.embedding!),
      }))
      .sort((a, b) => b.score - a.score);
      
    const philips = scored.find(p => p.name.includes("Mixer"));
    if (philips) console.log(`[Philips Mixer Score: ${philips.score.toFixed(3)}]`);
    
    scored.slice(0, 5).forEach(r => {
      console.log(`[Score: ${r.score.toFixed(3)}] ${r.name}`);
    });
  }
}

main().catch(console.error);
