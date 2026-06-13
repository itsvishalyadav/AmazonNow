// backend/src/services/agentrouter.ts
// Phase 2: OpenAI-compatible client for AgentRouter.
// All LLM, vision, and embedding calls go through this module.
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import OpenAI from "openai";

// ── Client ───────────────────────────────────────────────────────────────────
const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY!,
  baseURL: process.env.AGENTROUTER_BASE_URL!, // https://agentrouter.org/v1
});

const MODEL = process.env.AGENTROUTER_MODEL!;
const EMBED_MODEL = process.env.AGENTROUTER_EMBED_MODEL!;

// ── safeJSON helper ───────────────────────────────────────────────────────────
// Parses the model output as JSON. On failure, retries once with a repair
// prompt. If the repair also fails, throws so the caller can handle it.
export async function safeJSON(raw: string): Promise<any> {
  try {
    return JSON.parse(raw);
  } catch {
    console.warn("[agentrouter] JSON parse failed — attempting repair...");
    const repair = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a JSON repair assistant. Return ONLY valid JSON with no prose, markdown, or explanation." },
        { role: "user", content: `Fix this malformed JSON and return only the corrected JSON:\n\n${raw}` },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return JSON.parse(repair.choices[0].message.content!);
  }
}

// ── chatJSON ──────────────────────────────────────────────────────────────────
// Standard JSON-mode chat call (text only). Used for parse_intent + assemble.
export async function chatJSON(system: string, user: any): Promise<any> {
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: typeof user === "string" ? user : JSON.stringify(user) },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }, // supported on most models; instruct JSON-only as fallback
  });
  return safeJSON(res.choices[0].message.content!);
}

// ── chatVisionJSON ────────────────────────────────────────────────────────────
// Vision call: passes image as a base64 data URL alongside text.
// AgentRouter is OpenAI-compatible — same API, vision-capable model required.
export async function chatVisionJSON(
  system: string,
  text: string,
  imageBase64: string
): Promise<any> {
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });
  return safeJSON(res.choices[0].message.content!);
}

// ── embed ─────────────────────────────────────────────────────────────────────
// Returns an embedding vector for a given text string.
export async function embed(text: string): Promise<number[]> {
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

// ── Connectivity check (used at startup) ─────────────────────────────────────
export async function checkConnectivity(): Promise<boolean> {
  try {
    await embed("ping");
    return true;
  } catch {
    return false;
  }
}
