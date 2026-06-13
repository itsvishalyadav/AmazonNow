import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT ?? 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow base64 images

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "amazon-now-backend", ts: new Date().toISOString() });
});

// ── Routes (stubbed; each phase wires real routers here) ──────────────────────
// Phase 4: intent router
// app.use("/api/intent", intentRouter);
// Phase 10: emergency router
// app.use("/api/emergency", emergencyRouter);
// Phase 10: feedback router
// app.use("/api/feedback", feedbackRouter);
// Phase 11: reorder router
// app.use("/api/reorder", reorderRouter);
// Phase 11: proactive router
// app.use("/api/proactive", proactiveRouter);
// Phase 5: checkout router
// app.use("/api/checkout", checkoutRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Amazon Now backend running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

export default app;
