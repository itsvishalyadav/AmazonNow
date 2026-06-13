// backend/src/routes/proactive.ts
// Phase 11 (F5): GET /api/proactive/:userId — context-aware proactive suggestions.
// Uses today's date to detect Indian festivals and current weather signal.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { buildCart } from "../agent/nowAgent.js";
import { getUpcomingEvents } from "../services/calendar.js";

const router = Router();

// ── Static Indian festival calendar (month-day based) ─────────────────────────
// Format: "MM-DD": { name, intent }
const FESTIVAL_CALENDAR: Record<string, { name: string; intent: string }> = {
  "01-14": { name: "Makar Sankranti / Lohri", intent: "Makar Sankranti celebration — need til (sesame), gud (jaggery), rewri, peanuts, and sweet items for the festival" },
  "03-25": { name: "Holi", intent: "Holi festival — need thandai ingredients (milk, rose syrup, dry fruits), colours are mocked, also gujiya ingredients, mathri" },
  "10-02": { name: "Navratri begins", intent: "Navratri vrat — need sabudana, singhara flour, kuttu atta, rock salt, potatoes, fruits, yogurt. No onion or garlic." },
  "10-20": { name: "Diwali", intent: "Diwali celebration for 10 people — need sweets like kaju katli, dry fruits, namkeen, diyas (mocked), candles, flowers, mithai box items" },
  "11-01": { name: "Diwali season", intent: "Post-Diwali — need snacks for guests, biscuits, cold drinks, sweets, and quick party snacks" },
  "12-25": { name: "Christmas", intent: "Christmas celebration — need cake ingredients (maida, eggs, butter, sugar, chocolate), cold drinks, cheese, snacks for party" },
};

// ── Simple season detection ────────────────────────────────────────────────────
function getSeasonSignal(month: number): { name: string; intent: string } | null {
  if (month >= 4 && month <= 6) {
    return {
      name: "Summer Heatwave",
      intent: "It's summer — need cooling essentials: ORS/Electral sachets, Bisleri water (bulk), cold drinks, kokum sherbet, nimbu pani items, mango drinks, ice cream (mocked)",
    };
  }
  if (month >= 7 && month <= 9) {
    return {
      name: "Monsoon Season",
      intent: "Monsoon weather — perfect for comfort food: Maggi noodles, poha, chai (Tata Tea), pakoda ingredients (besan, potatoes, onions), hot soup, umbrella (mocked)",
    };
  }
  if (month >= 11 || month <= 1) {
    return {
      name: "Winter Warmth",
      intent: "Cold winter — need warming essentials: ginger (adrak), jaggery (gud), sesame (til), blankets (mocked), hot chocolate, tea, and hearty dal ingredients",
    };
  }
  return null;
}

// Simple in-memory cache to prevent repetitive LLM calls on reload
const proactiveCache = new Map<string, { timestamp: number; proposal: any }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  const monthDay = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const month = today.getMonth() + 1;

  // Check Calendar first!
  const calendarEvent = await getUpcomingEvents(userId);

  // Pick calendar first, then festival, then season
  const festival = FESTIVAL_CALENDAR[monthDay];
  const season = getSeasonSignal(month);
  const signal = calendarEvent ?? festival ?? season;

  if (!signal) {
    return res.json({ suggestions: [] });
  }

  const cacheKey = `${userId}_${signal.name}`;
  const cached = proactiveCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({
      suggestions: [{ signal: signal.name, proposal: cached.proposal }]
    });
  }

  try {
    const proposal = await buildCart({ userId, text: signal.intent });
    
    // Save to cache
    proactiveCache.set(cacheKey, { timestamp: Date.now(), proposal });

    return res.json({
      suggestions: [
        {
          signal: signal.name,
          proposal,
        },
      ],
    });
  } catch (err: any) {
    console.error("[GET /api/proactive] Error:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

export default router;
