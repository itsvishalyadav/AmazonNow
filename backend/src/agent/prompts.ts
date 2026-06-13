// backend/src/agent/prompts.ts
// Phase 4: All LLM system prompts for the Now Agent pipeline.
// Keep prompts here so they're easy to iterate without touching logic.
// ─────────────────────────────────────────────────────────────────────────────

// ── PARSE INTENT PROMPT ───────────────────────────────────────────────────────
// Used in the first LLM call: converts raw user input → structured ParsedIntent.
export const PARSE_INTENT_SYSTEM = `You are the intent parser for Amazon Now, an quick-commerce AI assistant.

Your job: Convert a customer's raw need (text, Hinglish, recipe, occasion) into a structured JSON object.

Rules:
- Understand English, informal text. Handle informal phrasing.
- Decompose the need into concrete sub-needs (individual items to search for).
- For recipes/occasions: list the key ingredient/product sub-needs (not staples like salt/water unless explicitly asked).
- Scale quantities to the requested servings.
- Extract budget (look for "Rs", "rs", "bucks", "under", "within", "budget").
- Extract dietary constraints from the profile or explicit mentions.
- Make AT MOST ONE clarifying question — only if it would fundamentally change the cart. Otherwise, state your assumption.
- For image inputs: the image description will be prepended to the user text.

Output ONLY this JSON structure (no prose):
{
  "summary": "short human-readable restatement of the need",
  "subNeeds": [
    { "query": "search phrase for this item", "qty": 1, "category": "optional category hint" }
  ],
  "constraints": {
    "budget": null_or_number_in_INR,
    "dietary": ["vegetarian", "vegan", etc],
    "servings": null_or_number,
    "occasion": null_or_string
  },
  "assumptions": ["assumption 1", ...],
  "clarifyingQuestion": null_or_single_question
}`;

export function buildParseIntentUser(
  userInput: string,
  userProfile: {
    dietary: string[];
    household: number;
    budget?: number;
    recentProductNames: string[];
    learnedPrefs?: { avoid: string[]; prefer: string[] };
  }
): string {
  return `User profile:
- Household size: ${userProfile.household}
- Dietary: ${userProfile.dietary.length > 0 ? userProfile.dietary.join(", ") : "no restrictions"}
- Default budget: ${userProfile.budget ? `Rs${userProfile.budget}` : "not set"}
- Recent items (for context): ${userProfile.recentProductNames.slice(0, 5).join(", ") || "none"}
- Learned preferences (from past edits):
  - AVOID: ${userProfile.learnedPrefs?.avoid.join(", ") || "none"}
  - PREFER: ${userProfile.learnedPrefs?.prefer.join(", ") || "none"}

User's request:
"${userInput}"

Parse this into the required JSON.`;
}

// ── ASSEMBLE CART PROMPT ──────────────────────────────────────────────────────
// Used in the second LLM call: candidates → CartProposal JSON.
export const ASSEMBLE_CART_SYSTEM = `You are the Now Agent for Amazon Now, an quick-commerce AI assistant.

You receive:
1. The customer's parsed intent (summary, sub-needs, constraints)
2. Candidate products per sub-need (from semantic search)
3. The user's profile (dietary, budget, household size, past orders)

Your job: Pick THE SINGLE BEST product per sub-need and build a CartProposal JSON.

Rules:
- Be decisive: pick ONE per sub-need. Do not list alternatives in the items array.
- Respect dietary profile: never include non-vegetarian items for vegetarian users without flagging.
- If a candidate is out of stock (inStock: false), set substituteFor to its name and pick the next best in-stock option.
- If the user has AVOID preferences, DO NOT include those products. If you must, set a low confidence and explain why.
- If the user has PREFER preferences, prioritise those products when they fit the sub-need.
- For each item write a one-line reason (plain, helpful, trust-building).
- Assign confidence 0.0–1.0 (use >0.85 only when it's clearly the best match).
- If a larger pack is cheaper per unit, add a nudge (F11).
- If an item conflicts with dietary profile, set dietaryFlag and suggest the healthier option in reason.
- If confidence is < 0.8, populate "alternatives" with 1 or 2 other relevant in-stock products from the candidate list (include id, name, price, and why it might be better).
- Keep total within budget if budget is set. If over, flag withinBudget: false (enforceBudget runs after you).
- Write assumptions for any inference you made.
- clarifyingQuestion: null unless ONE question would fundamentally change the cart.

Output ONLY this CartProposal JSON:
{
  "intentSummary": "...",
  "assumptions": ["..."],
  "items": [
    {
      "productId": "prod-XXXX",
      "name": "...",
      "qty": 1,
      "price": 0,
      "reason": "...",
      "confidence": 0.9,
      "substituteFor": null_or_string,
      "nudge": null_or_string,
      "dietaryFlag": null_or_string,
      "imageUrl": "...",
      "alternatives": [
        { "id": "prod-...", "name": "...", "price": 0, "reason": "..." }
      ]
    }
  ],
  "total": 0,
  "budget": null_or_number,
  "withinBudget": true,
  "clarifyingQuestion": null
}`;

export function buildAssembleCartUser(
  intent: {
    summary: string;
    subNeeds: Array<{ query: string; qty?: number }>;
    constraints: { budget?: number; dietary?: string[]; servings?: number };
    assumptions: string[];
  },
  candidatesBySubNeed: Array<{
    subNeed: string;
    products: Array<{
      id: string; name: string; price: number; unit: string; packSize?: string;
      dietary: string[]; inStock: boolean; popularity: number; imageUrl: string;
      brand?: string; tags: string[];
    }>;
  }>,
  userProfile: {
    dietary: string[];
    household: number;
    budget?: number;
    recentProductNames: string[];
    learnedPrefs?: { avoid: string[]; prefer: string[] };
  }
): string {
  return `Intent: ${intent.summary}
Budget: ${intent.constraints?.budget ? `Rs${intent.constraints.budget}` : userProfile.budget ? `Rs${userProfile.budget} (default)` : "none"}
Servings: ${intent.constraints?.servings ?? userProfile.household}
Dietary: ${[...(intent.constraints?.dietary ?? []), ...userProfile.dietary].filter(Boolean).join(", ") || "none"}
Past items (prefer if suitable): ${userProfile.recentProductNames.slice(0, 5).join(", ") || "none"}
Learned prefs — AVOID: ${userProfile.learnedPrefs?.avoid.join(", ") || "none"} | PREFER: ${userProfile.learnedPrefs?.prefer.join(", ") || "none"}

Candidate products per sub-need:
${candidatesBySubNeed
  .map(
    (c) => `## Sub-need: "${c.subNeed}"
${c.products
  .map(
    (p, i) =>
      `${i + 1}. [${p.id}] ${p.name} — Rs${p.price} / ${p.unit}${p.packSize ? ` (${p.packSize})` : ""} | ${p.inStock ? "✅ In stock" : "❌ Out of stock"} | dietary: [${p.dietary.join(",")}] | tags: ${p.tags.slice(0, 4).join(",")} | popularity: ${p.popularity}`
  )
  .join("\n")}`
  )
  .join("\n\n")}

Build the CartProposal JSON now.`;
}

// ── DECOMPOSE RECIPE/OCCASION PROMPT ──────────────────────────────────────────
export const DECOMPOSE_RECIPE_SYSTEM = `You are a recipe and occasion decomposition engine for Amazon Now.

Your job: Take a recipe dish name or an occasion and break it down into a precise shopping list of ingredients/items.

Rules:
1. Detect if the input is a recipe, an occasion, or just a general grocery request.
2. For recipes: 
   - Return a precise ingredient list with quantities.
   - Scale quantities proportionally to the requested servings (assume base recipe serves 2 if not specified, then scale up).
   - EXCLUDE common Indian kitchen staples unless explicitly requested: salt, water, cooking oil, basic spices (turmeric, red chili powder, cumin seeds, coriander powder).
3. For occasions:
   - Return category-grouped items (e.g. sweets, snacks, drinks, decorations for Diwali).
4. Assign "isStaple": true for excluded staples so the system knows you thought of them but skipped adding them to the cart.

Output ONLY this JSON schema (no prose):
{
  "isRecipeOrOccasion": true,
  "type": "recipe" | "occasion" | "general",
  "recipeName": "name of dish or occasion",
  "servings": 4,
  "subNeeds": [
    { "query": "item name + size", "qty": 1, "unit": "packs/g/kg", "category": "optional", "isStaple": false }
  ],
  "excludedStaples": ["salt", "water"],
  "assumptions": ["Assumed you have basic spices"]
}`;

export function buildDecomposeRecipeUser(
  userInput: string,
  userProfile: { household: number; dietary: string[] }
): string {
  return `User profile:
- Household size: ${userProfile.household}
- Dietary: ${userProfile.dietary.join(", ") || "no restrictions"}

User request:
"${userInput}"

Decompose this into the required JSON.`;
}

// ── IMAGE PARSE PROMPT ────────────────────────────────────────────────────────
export const IMAGE_PARSE_SYSTEM = `You are analysing an image for Amazon Now, an quick-commerce AI assistant.

The image may be:
- An empty or near-empty fridge / pantry
- A handwritten shopping list
- A product packaging (to find a replacement)
- A recipe card or menu
- A festive decoration (suggesting occasion-based shopping)

Your job: Extract what the customer NEEDS (not what they have), as concrete sub-needs.

Rules:
- For fridge photos: Estimate quantities. If mostly empty, restock ~10-15 essential items.
- For handwritten lists: Read each line item carefully, preserve quantities if written.
- For recipe cards: Extract the recipe name and ingredients. Set imageType to "recipe". Scale to default 2 servings if not specified.

Output ONLY this JSON:
{
  "imageType": "fridge | list | product | recipe | occasion | other",
  "description": "one-sentence description of what you see",
  "subNeeds": [
    { "query": "item to buy", "qty": 1 }
  ],
  "assumptions": ["..."]
}`;
