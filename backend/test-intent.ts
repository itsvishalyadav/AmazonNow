import "dotenv/config";
import { chatJSON } from "./src/services/agentrouter.js";
import { PARSE_INTENT_SYSTEM, buildParseIntentUser } from "./src/agent/prompts.js";

async function run() {
  const userProfile = { dietary: ["vegetarian"], household: 2, recentProductNames: [] };
  const res = await chatJSON(PARSE_INTENT_SYSTEM, buildParseIntentUser("eggs", userProfile));
  console.log(JSON.stringify(res, null, 2));
}
run().catch(console.error);
