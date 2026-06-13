import "dotenv/config";
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY!,
  baseURL: process.env.AGENTROUTER_BASE_URL!,
});
async function main() {
  const res = await client.embeddings.create({ model: "text-embedding-3-small", input: "test" });
  console.log("Embedding 3 small length:", res.data[0].embedding.length);
}
main();
