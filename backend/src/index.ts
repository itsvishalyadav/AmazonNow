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
import historyRouter from "./routes/history.js";

// Proxy removed
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

// Debug route removed
// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/intent", intentRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/reorder", reorderRouter);
app.use("/api/proactive", proactiveRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/history", historyRouter);

// Proxy startup removed
app.listen(PORT, () => {
  console.log(`\n🚀 Amazon Now backend running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Catalog: ${count()} products loaded`);
  console.log(`   Model: amazon.nova-lite-v1:0`);
  console.log(`   Embed: amazon.titan-embed-text-v2:0\n`);
});

export default app;
