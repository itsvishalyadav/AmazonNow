// backend/src/routes/emergency.ts
// Phase 10 (F12): POST /api/emergency — one-tap emergency cart.
// Body: { userId: string, scenario: "sick" | "guests" | "out_of_staples" | "baby_emergency" | "power_cut" }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { buildCart } from "../agent/nowAgent.js";

const router = Router();

// Pre-defined scenario → intent text mapping
const SCENARIOS: Record<string, string> = {
  cut_finger: "I've cut my finger and need immediate first-aid — band-aids, dettol or savlon, and cotton rolls",
  burned_cooking: "I burned the cooking and have a minor burn — need Burnol cream, plus ready-to-eat dinner like Maggi and cold drinks",
  severe_cramps: "Having severe period cramps — urgent need for a hot water bag, Crocin pain relief, dark chocolate, and sanitary pads",
  sudden_guests: "Unexpected guests arrived! Need chips, cold drinks, biscuits, and instant coffee",
  sick_pet: "My pet dog is sick with an upset stomach — need plain rice, curd, and pet food",
};

const SCENARIO_META: Record<string, { label: string; icon: string; description: string }> = {
  cut_finger:     { label: "Cut Finger",     icon: "Activity", description: "Band-aids, Dettol, cotton" },
  burned_cooking: { label: "Burned Cooking", icon: "Flame",    description: "Burnol, Maggi, drinks" },
  severe_cramps:  { label: "Severe Cramps",  icon: "HeartPulse", description: "Hot water bag, Crocin, pads" },
  sudden_guests:  { label: "Sudden Guests",  icon: "Users",    description: "Chips, drinks, coffee" },
  sick_pet:       { label: "Sick Pet",       icon: "Bone",     description: "Rice, curd, pet food" },
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
