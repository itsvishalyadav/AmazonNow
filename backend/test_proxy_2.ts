import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY || "sk-FBvxC2p",
  baseURL: process.env.AGENTROUTER_BASE_URL || "http://localhost:8318/v1",
});

async function run() {
  console.log("Testing PARSE_INTENT_SYSTEM with response_format...");
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
      response_format: { type: "json_object" },
    });
    console.log("Parse intent success:", res2.choices[0].message.content);
  } catch (err: any) {
    console.error("Parse intent failed:", err.message);
  }
}

run();
