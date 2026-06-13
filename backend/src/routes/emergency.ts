// backend/src/routes/emergency.ts
// Phase 10 (F12): POST /api/emergency — one-tap emergency cart.
// Body: { userId: string, scenario: "sick" | "guests" | "out_of_staples" | "baby_emergency" | "power_cut" }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { buildCart } from "../agent/nowAgent.js";

const router = Router();

// Pre-defined scenario → intent text mapping
const SCENARIOS: Record<string, string> = {
  sick: "I'm sick and need immediate essentials — ORS packets, electrolytes, fever tablets like Dolo, Vicks VapoRub, light food like khichdi ingredients, soup, and plenty of water",
  guests: "Guests arriving in an hour! Need snacks, cold drinks, biscuits, namkeen, tea, coffee, and quick things to serve",
  out_of_staples: "I've run out of daily staples — urgent need for milk, bread, eggs, ghee, toor dal, tata salt, and cooking oil",
  baby_emergency: "Baby emergency — need diapers, baby wipes, baby food or formula, and baby powder immediately",
  power_cut: "Power cut expected — need candles or torches, water bottles, ready-to-eat food that doesn't need cooking, and cold drinks",
};

router.post("/", async (req, res) => {
  const { userId, scenario } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const scenarioText = SCENARIOS[scenario] ?? scenario;

  if (!scenarioText) {
    return res.status(400).json({
      error: "scenario is required",
      validScenarios: Object.keys(SCENARIOS),
    });
  }

  try {
    const proposal = await buildCart({ userId, text: scenarioText });
    return res.json(proposal);
  } catch (err: any) {
    console.error("[POST /api/emergency] Error:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

export default router;
