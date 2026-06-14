// backend/src/routes/emergency.ts
// Phase 10 (F12): POST /api/emergency — one-tap emergency cart.
// Body: { userId: string, scenario: "sick" | "guests" | "out_of_staples" | "baby_emergency" | "power_cut" }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { buildCart } from "../agent/nowAgent.js";

const router = Router();

// Pre-defined scenario → intent text mapping
const SCENARIOS: Record<string, string> = {
  cut_finger: "I've cut my finger and need immediate first-aid — band-aids, dettol or savlon, cotton rolls, and antiseptic cream",
  burned_cooking: "I burned the cooking and have a minor burn — need Burnol or Silverex cream, plus ready-to-eat dinner like Maggi or pasta and cold drinks",
  severe_cramps: "Having severe period cramps — urgent need for a heating pad or hot water bag, Meftal Spas (mocked), dark chocolate, and sanitary pads",
  sudden_guests: "Unexpected guests arrived! Need snacks, cold drinks, biscuits, namkeen, instant coffee, and quick things to serve",
  sick_pet: "My pet dog is sick with an upset stomach — need plain rice, curd, digestive pet supplements or easy-to-digest dog food",
};

const SCENARIO_META: Record<string, { label: string; icon: string; description: string }> = {
  cut_finger:     { label: "Cut Finger",     icon: "Activity", description: "Band-aids, Dettol, cotton" },
  burned_cooking: { label: "Burned Cooking", icon: "Flame",    description: "Burnol, ready-to-eat dinner" },
  severe_cramps:  { label: "Severe Cramps",  icon: "HeartPulse", description: "Heating pad, Meftal, chocolate" },
  sudden_guests:  { label: "Sudden Guests",  icon: "Users",    description: "Drinks, snacks, instant coffee" },
  sick_pet:       { label: "Sick Pet",       icon: "Bone",     description: "Digestive supplements, plain food" },
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
