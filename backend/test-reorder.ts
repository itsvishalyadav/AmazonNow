import "dotenv/config";
import { getUserContextAllOrders } from "./src/services/userContext.js";
import { chatJSON } from "./src/services/agentrouter.js";
import { initCatalog } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  console.log("Catalog loaded.");

  const ctx = await getUserContextAllOrders("user-demo-01");
  const allOrders = ctx.allOrders;
  const nowMs = Date.now();
  const DAY_MS = 86400000;

  const recentOrders = allOrders.filter(o => (nowMs - new Date(o.createdAt).getTime()) <= 60 * DAY_MS);
  const orderHistoryForLLM = recentOrders.map(o => {
    const daysAgo = Math.floor((nowMs - new Date(o.createdAt).getTime()) / DAY_MS);
    return {
      daysAgo,
      items: o.items.map(i => ({
        id: i.productId,
        name: i.name || "Unknown Product",
        qty: i.qty
      }))
    };
  });

  const systemPrompt = `You are a proactive grocery restocking AI for Amazon Now.
Your goal is to predict which items the user is currently running low on and needs to reorder today.
You will be provided with the user's household size and their order history (how many days ago they bought each item).

CRITICAL INSTRUCTIONS:
1. Estimate the natural consumption rate for each product based on the household size.
2. If the 'daysAgo' is roughly equal to or greater than the estimated consumption time, they are running low. Suggest it.
3. If they bought it very recently and should still have plenty, DO NOT suggest it.
4. Even if an item was only bought ONCE in the history, you MUST estimate if it's running low based on time elapsed.
5. Return a JSON array of up to 8 products they are running low on, ordered by confidence.

Output ONLY a JSON array in this exact format:
[
  {
    "productId": "string",
    "confidence": 0.95,
    "reason": "A household of 4 typically consumes this in 14 days, and you last ordered it 16 days ago."
  }
]`;

  const userPrompt = {
    householdSize: ctx.user.household.size,
    dietary: ctx.user.household.dietary,
    orderHistory: orderHistoryForLLM
  };

  console.log("Sending prompt to Bedrock...");
  try {
    const result = await chatJSON(systemPrompt, userPrompt);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("LLM Error:", err);
  }
}

run().catch(console.error);
