import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY || "sk-FBvxC2p",
  baseURL: "http://localhost:8318/v1"
});

async function run() {
  console.log("Testing local 8318...");
  try {
    const res = await client.chat.completions.create({
      model: "deepseek-v4-pro",
      messages: [{ role: "user", content: "Say hello!" }]
    });
    console.log("Success:", res.choices[0].message.content);
  } catch (err: any) {
    console.error("Failed:", err.message);
  }
}

run();
