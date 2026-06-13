import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY || "sk-FBvxC2p",
  baseURL: "https://agentrouter.org/v1",
  defaultHeaders: {
    "Originator": "codex_cli_rs",
    "User-Agent": "codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal",
    "Version": "0.101.0"
  }
});

async function run() {
  console.log("Testing direct to agentrouter.org with headers...");
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
