// backend/src/routes/feedback.ts
// Phase 10 (F9): POST /api/feedback — learn from user edits.
// Body: { userId: string, removed?: string[], added?: string[] }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { updateLearnedPrefs } from "../services/userContext.js";

const router = Router();

router.post("/", async (req, res) => {
  const { userId, removed, added } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  await updateLearnedPrefs(userId, {
    avoided: removed,
    preferred: added,
  });

  return res.json({ ok: true });
});

export default router;
