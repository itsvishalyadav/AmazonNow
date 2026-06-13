import { chatJSON, embed } from "../src/services/agentrouter";
import { search } from "../src/services/vectorSearch";
import { loadCatalog } from "../src/services/catalog";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runTests() {
  console.log("=== PHASE 2: AgentRouter Client Test ===");
  try {
    const embedResult = await embed("test string");
    console.log("Embed result length:", embedResult.length);
    console.log("Embed success!");
  } catch (err: any) {
    console.warn("Phase 2 embed failed (often proxy lacks embedding model), err:", err.message);
  }

  try {
    const chatResult = await chatJSON("You are a grocery AI. Reply strictly with JSON like { \"ok\": true }.", "Bread");
    console.log("Chat result:", JSON.stringify(chatResult, null, 2));
    console.log("Chat success!");
  } catch (err) {
    console.error("Phase 2 test failed:", err);
  }

  console.log("\n=== PHASE 3: Vector Search Test ===");
  try {
    const searchResults = await search("breakfast bread eggs", {}, 5);
    console.log("Search results for 'breakfast bread eggs':");
    searchResults.forEach((r, i) => {
      console.log(`\n${i+1}. ${r.name} (Score: ${r._score.toFixed(4)})`);
      console.log(`   Category: ${r.category} > ${r.subcategory}`);
      console.log(`   Tags: ${r.tags.join(", ")}`);
    });
    console.log("Search success!");
  } catch (err) {
    console.error("Phase 3 test failed:", err);
  }
}

runTests();
