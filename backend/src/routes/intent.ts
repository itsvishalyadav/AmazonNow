// backend/src/routes/intent.ts
// Phase 4: POST /api/intent — main cart-building endpoint.
// Body: { userId: string, text?: string, imageBase64?: string }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { buildCart } from "../agent/nowAgent.js";

const router = Router();

router.post("/", async (req, res) => {
  const { userId, text, imageBase64, isChatMode } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (!text && !imageBase64) {
    return res.status(400).json({ error: "text or imageBase64 is required" });
  }

  try {
    const proposal = await buildCart({ userId, text, imageBase64, isChatMode });
    return res.json(proposal);
  } catch (err: any) {
    console.error("[POST /api/intent] Error:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

export default router;
