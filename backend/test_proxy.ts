import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY || "sk-FBvxC2p",
  baseURL: process.env.AGENTROUTER_BASE_URL || "http://localhost:8318/v1",
});

async function run() {
  console.log("Testing simple prompt...");
  try {
    const res1 = await client.chat.completions.create({
      model: "deepseek-v4-pro",
      messages: [
        { role: "system", content: "You are a grocery AI." },
        { role: "user", content: "I need milk" }
      ],
    });
    console.log("Simple prompt success:", res1.choices[0].message.content);
  } catch (err: any) {
    console.error("Simple prompt failed:", err.message);
  }

  console.log("\nTesting PARSE_INTENT_SYSTEM...");
  try {
    const PARSE_INTENT_SYSTEM = `You are the intent parser for Amazon Now, a quick-commerce AI assistant.
Your job: Convert a customer's raw need into a structured JSON object.
Output ONLY JSON.`;
    const res2 = await client.chat.completions.create({
      model: "deepseek-v4-pro",
      messages: [
        { role: "system", content: PARSE_INTENT_SYSTEM },
        { role: "user", content: "breakfast for 2 under 300" }
      ],
    });
    console.log("Parse intent success:", res2.choices[0].message.content);
  } catch (err: any) {
    console.error("Parse intent failed:", err.message);
  }
}

run();
