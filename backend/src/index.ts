// backend/src/index.ts
// Amazon Now — Backend Entry Point
// Lambda-ready Express service. Each route ports to a Lambda handler unchanged.
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cors from "cors";
import { count } from "./services/catalog.js";

// ── Routes ────────────────────────────────────────────────────────────────────
import intentRouter from "./routes/intent.js";
import emergencyRouter from "./routes/emergency.js";
import feedbackRouter from "./routes/feedback.js";
import reorderRouter from "./routes/reorder.js";
import proactiveRouter from "./routes/proactive.js";
import checkoutRouter from "./routes/checkout.js";

import { startAgentRouterProxy } from "./proxy.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow base64 images

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "amazon-now-backend",
    catalog: `${count()} products loaded`,
    ts: new Date().toISOString(),
  });
});

// ── Debug: raw LLM probe (dev only) ──────────────────────────────────────────
app.post("/api/debug-llm", async (_req, res) => {
  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey: process.env.AGENTROUTER_API_KEY!,
      baseURL: process.env.AGENTROUTER_BASE_URL!,
    });
    const raw = await client.chat.completions.create({
      model: process.env.AGENTROUTER_MODEL!,
      messages: [
        { role: "system", content: "Reply with exactly this JSON: {\"ok\":true}" },
        { role: "user", content: "ping" },
      ],
      temperature: 0,
    });
    return res.json({
      fullResponse: raw,
      choices: raw.choices,
      firstChoice: raw.choices?.[0],
      content: raw.choices?.[0]?.message?.content,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/intent", intentRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/reorder", reorderRouter);
app.use("/api/proactive", proactiveRouter);
app.use("/api/checkout", checkoutRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
// Start the built-in proxy server first (non-fatal if it fails)
try {
  startAgentRouterProxy();
} catch (err: any) {
  console.warn("⚠️  Proxy startup failed:", err.message, "— backend will still run");
}

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Amazon Now backend running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Catalog: ${count()} products loaded`);
  console.log(`   Model: ${process.env.AGENTROUTER_MODEL}`);
  console.log(`   Embed: local 128-dim (no API)\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown() {
  console.log("\n🛑 Shutting down gracefully...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000); // Force exit after 3s
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
