// backend/src/routes/emergency.ts
// Phase 10 (F12): POST /api/emergency — one-tap emergency cart.
// Body: { userId: string, scenario: "sick" | "guests" | "out_of_staples" | "baby_emergency" | "power_cut" }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { buildCart } from "../agent/nowAgent.js";

const router = Router();

// Pre-defined scenario → intent text mapping
const SCENARIOS: Record<string, string> = {
  cut_finger: "I have a deep cut on my finger, it's bleeding.",
  burned_cooking: "I burned my hand on the stove.",
  severe_cramps: "I have unbearable stomach cramps and need immediate relief.",
  sudden_guests: "3 friends showed up unexpectedly, need quick snacks and drinks.",
};

const SCENARIO_META: Record<string, { label: string; icon: string; description: string }> = {
  cut_finger: { label: 'Cut Finger', icon: 'Activity', description: 'Band-aids, Dettol, cotton' },
  burned_cooking: { label: 'Burned Cooking', icon: 'Flame', description: 'Burnol cream, cooling gel' },
  severe_cramps: { label: 'Severe Cramps', icon: 'HeartPulse', description: 'Hot water bag, Crocin, pads' },
  sudden_guests: { label: 'Sudden Guests', icon: 'Users', description: 'Chips, drinks, coffee' },
};

router.get("/scenarios", (_req, res) => {
  const scenarios = Object.entries(SCENARIOS).map(([id]) => ({
    id,
    label: SCENARIO_META[id].label,
    icon: SCENARIO_META[id].icon,
    description: SCENARIO_META[id].description,
  }));
  return res.json({ scenarios });
});

const emergencyCache: Record<string, any> = {};

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
    if (emergencyCache[scenario]) {
      console.log(`[POST /api/emergency] Serving ${scenario} from cache for speed.`);
      return res.json(emergencyCache[scenario]);
    }

    const proposal = await buildCart({ userId, text: scenarioText });
    emergencyCache[scenario] = proposal;
    return res.json(proposal);
  } catch (err: any) {
    console.error("[POST /api/emergency] Error:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

export async function preWarmEmergencyCarts() {
  console.log("[emergency] Pre-warming emergency carts...");
  for (const [scenario, text] of Object.entries(SCENARIOS)) {
    try {
      const proposal = await buildCart({ userId: "system-prewarm", text });
      emergencyCache[scenario] = proposal;
      console.log(`[emergency] Pre-warmed ${scenario}`);
    } catch (err) {
      console.error(`[emergency] Failed to pre-warm ${scenario}:`, err);
    }
  }
  console.log("[emergency] Pre-warming complete.");
}

export default router;
