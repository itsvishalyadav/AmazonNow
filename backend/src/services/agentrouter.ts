// backend/src/services/agentrouter.ts
// Replaced AgentRouter with Amazon Bedrock Nova Lite Pipeline
// ─────────────────────────────────────────────────────────────────────────────

import { BedrockRuntimeClient, ConverseCommand, Message } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

const REGION = "us-east-1";
const client = new BedrockRuntimeClient({ region: REGION });
const MODEL = "us.amazon.nova-lite-v1:0";

// ── JSON extraction helper ────────────────────────────────────────────────────
function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

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
export async function safeJSON(raw: string): Promise<any> {
  const cleaned = extractJSON(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn("[bedrock] JSON parse failed — attempting repair...");
    const command = new ConverseCommand({
      modelId: MODEL,
      system: [{ text: "You are a JSON repair assistant. Return ONLY valid JSON — no prose, no markdown, no explanation." }],
      messages: [
        {
          role: "user",
          content: [{ text: `Fix this malformed JSON and return ONLY the corrected JSON:\n\n${raw}` }]
        }
      ],
      inferenceConfig: { temperature: 0 }
    });
    
    const repair = await client.send(command);
    const repairContent = repair.output?.message?.content?.[0]?.text ?? "{}";
    return JSON.parse(extractJSON(repairContent));
  }
}

// ── chatJSON ──────────────────────────────────────────────────────────────────
export async function chatJSON(system: string, user: any): Promise<any> {
  console.log("[bedrock] chatJSON called using", MODEL);
  const userText = typeof user === "string" ? user : JSON.stringify(user);

  const command = new ConverseCommand({
    modelId: MODEL,
    system: [{ text: system }],
    messages: [
      {
        role: "user",
        content: [{ text: userText }]
      }
    ],
    inferenceConfig: { temperature: 0.2 }
  });

  const res = await client.send(command);
  console.log("[bedrock] chatJSON received response");

  const content = res.output?.message?.content?.[0]?.text;
  if (!content) {
    throw new Error("LLM returned an empty response");
  }
  return safeJSON(content);
}

// ── chatVisionJSON ────────────────────────────────────────────────────────────
export async function chatVisionJSON(
  system: string,
  text: string,
  imageBase64: string
): Promise<any> {
  console.log("[bedrock] chatVisionJSON called using", MODEL);

  let format: "png" | "jpeg" | "gif" | "webp" = "jpeg";
  if (imageBase64.startsWith('iVBOR')) format = "png";
  else if (imageBase64.startsWith('R0lGOD')) format = "gif";
  else if (imageBase64.startsWith('UklGR')) format = "webp";

  // Decode base64 string to Uint8Array
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const imageUint8Array = new Uint8Array(imageBuffer);

  const command = new ConverseCommand({
    modelId: MODEL,
    system: [{ text: system }],
    messages: [
      {
        role: "user",
        content: [
          {
            image: {
              format,
              source: { bytes: imageUint8Array }
            }
          },
          { text }
        ]
      }
    ],
    inferenceConfig: { temperature: 0.2 }
  });

  const res = await client.send(command);
  
  const content = res.output?.message?.content?.[0]?.text;
  if (!content) {
    throw new Error("Vision LLM returned an empty response");
  }
  return safeJSON(content);
}

// ── checkConnectivity ─────────────────────────────────────────────────────────
export async function checkConnectivity(): Promise<boolean> {
  try {
    // A simple ping query to verify connectivity
    await chatJSON("Reply ok", "ping");
    return true;
  } catch {
    return false;
  }
}
