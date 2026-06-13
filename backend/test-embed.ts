import "dotenv/config";
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY!,
  baseURL: process.env.AGENTROUTER_BASE_URL!,
});
const EMBED_MODEL = process.env.AGENTROUTER_EMBED_MODEL ?? "text-embedding-3-small";
async function main() {
  const res = await client.embeddings.create({ model: EMBED_MODEL, input: "test" });
  console.log("Embedding length:", res.data[0].embedding.length);
}
main();
