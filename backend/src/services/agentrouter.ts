// backend/src/services/agentrouter.ts
// Phase 2: OpenAI-compatible client for AgentRouter.
// All LLM, vision, and embedding calls go through this module.
// NOTE: response_format is NOT used — not all models on AgentRouter support it.
//       JSON is enforced via system-prompt instruction only.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

console.log("API KEY:", process.env.AGENTROUTER_API_KEY?.slice(0, 10));
console.log("BASE URL:", process.env.AGENTROUTER_BASE_URL);
console.log("MODEL:", process.env.AGENTROUTER_MODEL);

// ── Client ───────────────────────────────────────────────────────────────────
const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY!,
  baseURL: process.env.AGENTROUTER_BASE_URL!, // https://agentrouter.org/v1
});

const MODEL = process.env.AGENTROUTER_MODEL!;
const EMBED_MODEL = process.env.AGENTROUTER_EMBED_MODEL!;

// ── JSON extraction helper ────────────────────────────────────────────────────
// Extracts JSON from a model response that may contain markdown fences or prose.
function extractJSON(raw: string): string {
  // Strip markdown code blocks ```json ... ``` or ``` ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find the first { or [ and the matching close bracket
  const firstBrace = raw.indexOf("{");
  const firstBracket = raw.indexOf("[");
  const start =
    firstBrace === -1 ? firstBracket :
    firstBracket === -1 ? firstBrace :
    Math.min(firstBrace, firstBracket);

  if (start === -1) return raw;
  return raw.slice(start);
}

// ── safeJSON helper ───────────────────────────────────────────────────────────
// Parses the model output as JSON. On failure, retries once with a repair prompt.
export async function safeJSON(raw: string): Promise<any> {
  const cleaned = extractJSON(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn("[agentrouter] JSON parse failed — attempting repair...");
    console.warn("[agentrouter] Raw content (first 300 chars):", raw.slice(0, 300));
    const repair = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON repair assistant. Return ONLY valid JSON — no prose, no markdown, no explanation.",
        },
        {
          role: "user",
          content: `Fix this malformed JSON and return ONLY the corrected JSON:\n\n${raw}`,
        },
      ],
      temperature: 0,
    });
    const repairContent = repair.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(extractJSON(repairContent));
  }
}

// ── chatJSON ──────────────────────────────────────────────────────────────────
// Standard JSON chat call (text only). Used for parse_intent + assemble.
// We do NOT pass response_format — not all AgentRouter models support it.
// The system prompt already mandates JSON-only output.
export async function chatJSON(system: string, user: any): Promise<any> {
  console.log("[agentrouter] chatJSON called");
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: typeof user === "string" ? user : JSON.stringify(user),
      },
    ],
    temperature: 0.2,
  });
  console.log("[agentrouter] chatJSON received response");

  const parsedRes = typeof res === "string" ? JSON.parse(res) : res;
  const content = parsedRes.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[agentrouter] chatJSON: empty response. choices:", JSON.stringify(parsedRes.choices));
    throw new Error("LLM returned an empty response");
  }
  return safeJSON(content);
}

// ── chatVisionJSON ────────────────────────────────────────────────────────────
// Vision call: passes image as a base64 data URL alongside text.
export async function chatVisionJSON(
  system: string,
  text: string,
  imageBase64: string
): Promise<any> {
  const detectMimeType = (base64: string) => {
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBOR')) return 'image/png';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg'; // default fallback
  };

  console.log("[agentrouter] chatVisionJSON called");
  const res = await client.chat.completions.create({
    model: process.env.AGENTROUTER_VISION_MODEL || "claude-opus-4-7",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `${system}\n\n${text}` },
          {
            type: "image_url",
            image_url: { url: `data:${detectMimeType(imageBase64)};base64,${imageBase64}` },
          },
        ],
      },
    ],
    temperature: 0.2,
  });

  // Handle proxy bug where Claude endpoints sometimes return a stringified response instead of parsed JSON
  const parsedRes = typeof res === "string" ? JSON.parse(res) : res;

  const content = parsedRes.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[agentrouter] chatVisionJSON: empty response. Raw res:", res);
    throw new Error("Vision LLM returned an empty response");
  }
  return safeJSON(content);
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
