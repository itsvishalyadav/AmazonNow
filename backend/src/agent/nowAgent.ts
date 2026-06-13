// backend/src/agent/nowAgent.ts
// Phase 4+6: The Now Agent — orchestrated pipeline with performance optimizations.
// - Single-call fast mode for simple queries (1 LLM call instead of 2)
// - LLM response cache (5-minute TTL)
// - Timing logs for every pipeline step
// - Reduced topK (5 instead of 8) for faster LLM generation
// ─────────────────────────────────────────────────────────────────────────────
import { chatJSON, chatVisionJSON } from "../services/agentrouter.js";
import { search, findSubstitute } from "../services/vectorSearch.js";
import { getUserContext } from "../services/userContext.js";
import { getById } from "../services/catalog.js";
import { CartProposalSchema } from "../types/index.js";
import type { CartProposal, CartItem, ParsedIntent, Product } from "../types/index.js";
import {
  PARSE_INTENT_SYSTEM,
  ASSEMBLE_CART_SYSTEM,
  FAST_CART_SYSTEM,
  IMAGE_PARSE_SYSTEM,
  buildParseIntentUser,
  buildAssembleCartUser,
  buildFastCartUser,
} from "./prompts.js";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BuildCartInput {
  userId: string;
  text?: string;
  imageBase64?: string;
}

// ── LLM Response Cache (5-minute TTL) ─────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, { result: CartProposal; ts: number }>();

function getCacheKey(input: BuildCartInput): string {
  // Simple hash: userId + text (ignore image for caching)
  return `${input.userId}::${(input.text ?? "").trim().toLowerCase()}`;
}

function getCached(key: string): CartProposal | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  console.log("[nowAgent] ⚡ Cache hit — returning cached result");
  return entry.result;
}

function setCache(key: string, result: CartProposal): void {
  responseCache.set(key, { result, ts: Date.now() });
  // Evict old entries if cache grows too large
  if (responseCache.size > 50) {
    const oldest = [...responseCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) responseCache.delete(oldest[0]);
  }
}

// ── Step 1: Parse intent ──────────────────────────────────────────────────────
async function parseIntent(
  input: BuildCartInput,
  userProfile: { dietary: string[]; household: number; budget?: number; recentProductNames: string[] }
): Promise<ParsedIntent> {
  const userText = input.text ?? "";

  if (input.imageBase64) {
    // Vision path: parse the image first, then merge with any text
    const imageResult = await chatVisionJSON(
      IMAGE_PARSE_SYSTEM,
      `The customer said: "${userText || "Please tell me what I need from this image"}". Extract what they need.`,
      input.imageBase64
    );

    // Now parse the combined text + image sub-needs as a regular intent
    const combinedText = `[From image — ${imageResult.imageType}: ${imageResult.description}] 
Identified needs: ${imageResult.subNeeds?.map((s: any) => s.query).join(", ")}
Customer said: ${userText || "(no additional text)"}`;

    return chatJSON(
      PARSE_INTENT_SYSTEM,
      buildParseIntentUser(combinedText, userProfile)
    ) as Promise<ParsedIntent>;
  }

  // Text-only path
  return chatJSON(
    PARSE_INTENT_SYSTEM,
    buildParseIntentUser(userText, userProfile)
  ) as Promise<ParsedIntent>;
}

// ── Step 2: Search candidates per sub-need ────────────────────────────────────
async function searchCandidates(
  intent: ParsedIntent,
  userProfile: { dietary: string[]; budget?: number }
): Promise<Array<{ subNeed: string; products: Product[] }>> {
  const combinedDietary = [
    ...(intent.constraints.dietary ?? []),
    ...userProfile.dietary,
  ].filter(Boolean);

  const results = await Promise.all(
    intent.subNeeds.map(async (sn) => {
      const products = await search(
        sn.query,
        {
          // We intentionally do not filter by sn.category because the LLM might guess "Bakery" 
          // while the catalog uses "Grocery & Staples". Semantic search handles relevance.
          maxPrice: intent.constraints.budget
            ? intent.constraints.budget * 0.7 // individual item cap
            : userProfile.budget,
          dietary: combinedDietary,
          inStockOnly: false, // we handle out-of-stock via substituteFor
        },
        5 // Reduced from 8 → 5: fewer candidates = shorter LLM input = faster generation
      );
      return { subNeed: sn.query, products };
    })
  );

  return results;
}

// ── Step 3: Assemble cart via LLM ─────────────────────────────────────────────
async function assembleCart(
  intent: ParsedIntent,
  candidatesBySubNeed: Array<{ subNeed: string; products: Product[] }>,
  userProfile: { dietary: string[]; household: number; budget?: number; recentProductNames: string[] }
): Promise<CartProposal> {
  const raw = await chatJSON(
    ASSEMBLE_CART_SYSTEM,
    buildAssembleCartUser(
      intent,
      candidatesBySubNeed.map((c) => ({
        subNeed: c.subNeed,
        products: c.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          packSize: p.packSize,
          dietary: p.dietary,
          inStock: p.inStock,
          imageUrl: p.imageUrl,
          tags: p.tags,
        })),
      })),
      userProfile
    )
  );

  // Validate with Zod; throw on failure (caller retries once)
  return CartProposalSchema.parse(raw);
}

// ── Fast Cart (single LLM call for simple queries) ────────────────────────────
async function fastCart(
  userInput: string,
  candidatesBySubNeed: Array<{ subNeed: string; products: Product[] }>,
  userProfile: { dietary: string[]; household: number; budget?: number; recentProductNames: string[] }
): Promise<CartProposal> {
  const raw = await chatJSON(
    FAST_CART_SYSTEM,
    buildFastCartUser(
      userInput,
      candidatesBySubNeed.map((c) => ({
        subNeed: c.subNeed,
        products: c.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          packSize: p.packSize,
          dietary: p.dietary,
          inStock: p.inStock,
          imageUrl: p.imageUrl,
          tags: p.tags,
        })),
      })),
      userProfile
    )
  );

  return CartProposalSchema.parse(raw);
}

// ── Step 4: Enforce substitutions (F7) ────────────────────────────────────────
// If LLM picked an out-of-stock item, swap it to the nearest in-stock match.
async function enforceAvailability(proposal: CartProposal): Promise<CartProposal> {
  const updatedItems: CartItem[] = [];

  for (const item of proposal.items) {
    const product = getById(item.productId);

    if (!product || !product.inStock) {
      // Find a substitute
      const baseProduct = product ?? {
        id: item.productId,
        name: item.name,
        category: "",
        subcategory: "",
        price: item.price,
        unit: "",
        tags: [],
        dietary: [],
        inStock: false,
        popularity: 0,
        imageUrl: item.imageUrl ?? "",
      };

      const sub = await findSubstitute(baseProduct as Product);
      if (sub) {
        updatedItems.push({
          ...item,
          productId: sub.id,
          name: sub.name,
          price: sub.price,
          imageUrl: sub.imageUrl,
          substituteFor: item.substituteFor ?? item.name,
          reason: `Substituted for "${item.name}" (out of stock). ${sub.name} is the closest available alternative.`,
          confidence: Math.min(item.confidence, 0.75),
        });
      } else {
        // No substitute found — keep the item but flag it
        updatedItems.push({
          ...item,
          reason: `⚠️ ${item.name} is currently out of stock. No close substitute found. Consider checking again shortly.`,
        });
      }
    } else {
      updatedItems.push(item);
    }
  }

  const total = updatedItems.reduce((s, i) => s + i.price * i.qty, 0);
  return { ...proposal, items: updatedItems, total };
}

// ── Step 5: Enforce budget (F3) ───────────────────────────────────────────────
// If cart exceeds budget, deterministically swap most-expensive items to
// cheaper same-subcategory alternatives until within budget.
async function enforceBudget(
  proposal: CartProposal,
  candidatesBySubNeed: Array<{ subNeed: string; products: Product[] }>
): Promise<CartProposal> {
  const budget = proposal.budget;
  if (!budget || proposal.total <= budget) {
    return { ...proposal, withinBudget: proposal.total <= (budget ?? Infinity) };
  }

  // Build a flat pool of all candidates for potential swaps
  const candidatePool = candidatesBySubNeed.flatMap((c) => c.products).filter((p) => p.inStock);

  let items = [...proposal.items];
  const swaps: CartProposal["rebalance"] = [];
  let total = proposal.total;

  // Keep swapping the most expensive item until within budget
  let iterations = 0;
  while (total > budget && iterations < items.length * 2) {
    iterations++;
    const sorted = [...items].sort((a, b) => b.price * b.qty - a.price * a.qty);
    const mostExpensive = sorted[0];

    // Find a cheaper in-stock alternative in the catalog
    const original = getById(mostExpensive.productId);
    if (!original) break;

    const cheaper = candidatePool.find(
      (p) =>
        p.id !== original.id &&
        p.subcategory === original.subcategory &&
        p.price * (mostExpensive.qty || 1) < mostExpensive.price * (mostExpensive.qty || 1) &&
        p.inStock
    );

    if (!cheaper) break;

    const saved = (mostExpensive.price - cheaper.price) * (mostExpensive.qty || 1);
    swaps.push({
      from: mostExpensive.name,
      to: cheaper.name,
      saved: Math.round(saved),
      reason: `Budget rebalance: ₹${Math.round(saved)} saved by switching to ${cheaper.name}`,
    });

    items = items.map((i) =>
      i.productId === mostExpensive.productId
        ? {
            ...i,
            productId: cheaper.id,
            name: cheaper.name,
            price: cheaper.price,
            imageUrl: cheaper.imageUrl,
            reason: `Budget-optimised pick (swapped from ${mostExpensive.name}, saved ₹${Math.round(saved)}).`,
          }
        : i
    );
    total = items.reduce((s, i) => s + i.price * i.qty, 0);
  }

  return {
    ...proposal,
    items,
    total: Math.round(total),
    withinBudget: total <= budget,
    rebalance: swaps.length > 0 ? swaps : undefined,
  };
}

// ── Quick keyword-based sub-need extraction (no LLM) ──────────────────────────
// For fast mode: extract search terms from user text without calling the LLM.
function extractSubNeeds(text: string): string[] {
  // Common meal/occasion expansions — so "breakfast" doesn't return just 1 item
  const EXPANSIONS: Record<string, string[]> = {
    breakfast: ["bread", "eggs", "milk", "butter", "cereal"],
    lunch: ["rice", "dal", "vegetables", "curd", "roti"],
    dinner: ["rice", "dal", "paneer", "vegetables", "chapati"],
    snacks: ["biscuits", "chips", "namkeen", "tea", "cookies"],
    party: ["cold drinks", "snacks", "sweets", "chips", "biscuits"],
    restock: ["milk", "bread", "eggs", "rice", "dal", "oil"],
    essentials: ["milk", "bread", "eggs", "rice", "dal"],
    sick: ["ORS", "paracetamol", "soup", "water", "electrolytes"],
    baby: ["diapers", "baby wipes", "baby food", "baby powder"],
  };

  const noise = new Set([
    "for", "and", "the", "a", "an", "with", "need", "want", "get", "me",
    "my", "some", "please", "i", "we", "us", "of", "to", "in", "under",
    "within", "around", "about", "people", "person", "persons", "rs",
    "rupees", "budget", "kal", "subah", "shaam", "raat", "aaj",
  ]);

  // Extract budget mention (remove from text)
  const cleanedText = text.replace(/(?:under|within|budget)\s*(?:rs|₹|rupees?)?\s*\d+/gi, "").trim();

  // Check for expansion keywords first
  const lower = cleanedText.toLowerCase();
  for (const [key, expansion] of Object.entries(EXPANSIONS)) {
    if (lower.includes(key)) {
      return expansion;
    }
  }

  // Split into meaningful phrases
  const parts = cleanedText
    .split(/[,;&]+|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .split(/\s+/)
        .filter((w) => !noise.has(w.toLowerCase()) && w.length > 1)
        .join(" ")
    )
    .filter((s) => s.length > 1);

  // If we got useful parts, return them; otherwise return the whole cleaned text
  return parts.length > 0 ? parts : [cleanedText].filter(Boolean);
}

// ── Main entry point ───────────────────────────────────────────────────────────
export async function buildCart(input: BuildCartInput): Promise<CartProposal> {
  const startTotal = Date.now();
  const { userId } = input;

  // 0. Check cache (skip for image queries)
  if (!input.imageBase64) {
    const cacheKey = getCacheKey(input);
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  // 1. Load user context
  console.time("[nowAgent] 1. loadUserContext");
  const ctx = getUserContext(userId);
  const userProfile = {
    dietary: ctx.user.household.dietary ?? [],
    household: ctx.user.household.size ?? 2,
    budget: ctx.user.defaultBudget,
    recentProductNames: ctx.recentProducts.map((p) => p.name),
  };
  console.timeEnd("[nowAgent] 1. loadUserContext");

  // ── Fast path: simple text queries without images ──────────────────────────
  // Use single LLM call (FAST_CART_SYSTEM) instead of two calls (parse + assemble)
  // Skip fast path for recipe/dish queries (they need LLM to decompose into ingredients)
  const RECIPE_HINTS = /masala|curry|biryani|khichdi|sabzi|recipe|cook|make|dish|prepare|dosa|idli|pulao|korma|dal\s+makhani/i;
  const isSimpleQuery = !input.imageBase64 && input.text && input.text.length < 150 && !RECIPE_HINTS.test(input.text);

  if (isSimpleQuery) {
    try {
      // Extract sub-needs locally (no LLM call)
      console.time("[nowAgent] FAST: extractSubNeeds");
      const subNeeds = extractSubNeeds(input.text!);
      console.timeEnd("[nowAgent] FAST: extractSubNeeds");

      // Extract budget from text
      const budgetMatch = input.text!.match(/(?:under|within|budget)\s*(?:rs|₹|rupees?)?\s*(\d+)/i);
      const textBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;

      // Search candidates per sub-need (instant — local embeddings)
      console.time("[nowAgent] FAST: searchCandidates");
      const candidatesBySubNeed = await Promise.all(
        subNeeds.map(async (query) => ({
          subNeed: query,
          products: await search(
            query,
            {
              maxPrice: (textBudget ?? userProfile.budget) ? (textBudget ?? userProfile.budget!) * 0.7 : undefined,
              dietary: userProfile.dietary,
              inStockOnly: false,
            },
            5
          ),
        }))
      );
      console.timeEnd("[nowAgent] FAST: searchCandidates");

      // Single LLM call: parse + assemble combined
      console.time("[nowAgent] FAST: singleLLMCall");
      let proposal = await fastCart(input.text!, candidatesBySubNeed, userProfile);
      console.timeEnd("[nowAgent] FAST: singleLLMCall");

      // Post-processing
      console.time("[nowAgent] FAST: postProcess");
      proposal = await enforceAvailability(proposal);
      const effectiveBudget = textBudget ?? userProfile.budget ?? null;
      proposal = { ...proposal, budget: effectiveBudget };
      proposal = await enforceBudget(proposal, candidatesBySubNeed);
      console.timeEnd("[nowAgent] FAST: postProcess");

      console.log(`[nowAgent] ⚡ FAST path completed in ${Date.now() - startTotal}ms`);

      // Cache the result
      if (!input.imageBase64) {
        setCache(getCacheKey(input), proposal);
      }

      return proposal;
    } catch (err) {
      console.warn("[nowAgent] Fast path failed, falling back to standard pipeline:", err);
      // Fall through to standard path
    }
  }

  // ── Standard path (complex queries, images, or fast-path fallback) ────────

  // 2. Parse intent (text or image)
  console.time("[nowAgent] 2. parseIntent");
  let intent: ParsedIntent;
  try {
    intent = await parseIntent(input, userProfile);
  } catch (err) {
    console.error("[nowAgent] parseIntent failed:", err);
    throw new Error("Could not understand your request. Please try again.");
  }
  console.timeEnd("[nowAgent] 2. parseIntent");

  // 3. Handle clarifying question early return
  if (intent.clarifyingQuestion && (!input.text || input.text.length < 10)) {
    return {
      intentSummary: intent.summary,
      assumptions: intent.assumptions,
      items: [],
      total: 0,
      budget: intent.constraints.budget ?? userProfile.budget ?? null,
      withinBudget: true,
      clarifyingQuestion: intent.clarifyingQuestion,
    };
  }

  // 4. Search candidates per sub-need (instant — local embeddings)
  console.time("[nowAgent] 3. searchCandidates");
  const candidatesBySubNeed = await searchCandidates(intent, userProfile);
  console.timeEnd("[nowAgent] 3. searchCandidates");
  console.log("[nowAgent] Candidates counts:", candidatesBySubNeed.map(c => `${c.subNeed}: ${c.products.length}`));

  // 5. Assemble cart via LLM (with one retry on Zod parse failure)
  console.time("[nowAgent] 4. assembleCart");
  let proposal: CartProposal;
  try {
    proposal = await assembleCart(intent, candidatesBySubNeed, userProfile);
  } catch (err) {
    console.warn("[nowAgent] First assemble attempt failed, retrying...", err);
    try {
      proposal = await assembleCart(intent, candidatesBySubNeed, userProfile);
    } catch (retryErr) {
      console.error("[nowAgent] assembleCart retry failed:", retryErr);
      throw new Error("Failed to build your cart. Please try again.");
    }
  }
  console.timeEnd("[nowAgent] 4. assembleCart");

  // 6. Enforce availability / substitution (F7)
  console.time("[nowAgent] 5. enforceAvailability");
  proposal = await enforceAvailability(proposal);
  console.timeEnd("[nowAgent] 5. enforceAvailability");

  // 7. Enforce budget (F3) — deterministic swaps
  console.time("[nowAgent] 6. enforceBudget");
  const effectiveBudget = intent.constraints.budget ?? userProfile.budget ?? null;
  proposal = { ...proposal, budget: effectiveBudget };
  proposal = await enforceBudget(proposal, candidatesBySubNeed);
  console.timeEnd("[nowAgent] 6. enforceBudget");

  // 8. Preserve clarifying question from the intent parser if it exists
  proposal.clarifyingQuestion = proposal.clarifyingQuestion || intent.clarifyingQuestion;

  console.log(`[nowAgent] Standard path completed in ${Date.now() - startTotal}ms`);

  // Cache the result
  if (!input.imageBase64) {
    setCache(getCacheKey(input), proposal);
  }

  return proposal;
}
