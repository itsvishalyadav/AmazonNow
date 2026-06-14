// backend/src/agent/nowAgent.ts
// Phase 4: The Now Agent — orchestrated pipeline (not free-running tool calls).
// Deterministic steps; LLM called only for (1) parse intent and (2) assemble cart.
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
  IMAGE_PARSE_SYSTEM,
  DECOMPOSE_RECIPE_SYSTEM,
  buildParseIntentUser,
  buildAssembleCartUser,
  buildDecomposeRecipeUser,
} from "./prompts.js";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BuildCartInput {
  userId: string;
  text?: string;
  imageBase64?: string;
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
    ...(intent.constraints?.dietary ?? []),
    ...userProfile.dietary,
  ].filter(Boolean);

  const results = await Promise.all(
    intent.subNeeds.map(async (sn) => {
      const products = await search(
        sn.query,
        {
          // We intentionally do not filter by sn.category because the LLM might guess "Bakery" 
          // while the catalog uses "Grocery & Staples". Semantic search handles relevance.
          maxPrice: intent.constraints?.budget
            ? intent.constraints.budget * 0.7 // individual item cap
            : userProfile.budget,
          dietary: combinedDietary,
          inStockOnly: false, // we handle out-of-stock via substituteFor
        },
        8
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
          popularity: p.popularity,
          imageUrl: p.imageUrl,
          brand: p.brand,
          tags: p.tags,
        })),
      })),
      userProfile
    )
  );

  // Validate with Zod; throw on failure (caller retries once)
  return CartProposalSchema.parse(raw);
}

// ── Step 4: Enforce substitutions (F7) and Confidence filtering ────────────────────────────────────────
// If LLM picked an out-of-stock item, swap it to the nearest in-stock match.
// Also filter out low-confidence halllucinations/placeholders.
async function enforceAvailability(proposal: CartProposal): Promise<CartProposal> {
  const updatedItems: CartItem[] = [];

  for (const item of proposal.items) {
    // Filter out very low confidence items (e.g., less than 30%)
    if (item.confidence < 0.3) {
      continue;
    }

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
        rating: undefined,
        reviewCount: undefined,
        deliveryTime: undefined,
        isPrime: undefined,
      };

      const sub = await findSubstitute(baseProduct as Product);
      if (sub) {
        updatedItems.push({
          ...item,
          productId: sub.id,
          name: sub.name,
          price: sub.price,
          imageUrl: sub.imageUrl,
          rating: sub.rating,
          reviewCount: sub.reviewCount,
          deliveryTime: sub.deliveryTime,
          isPrime: sub.isPrime,
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
      updatedItems.push({
        ...item,
        imageUrl: product.imageUrl,
        rating: product.rating,
        reviewCount: product.reviewCount,
        deliveryTime: product.deliveryTime,
        isPrime: product.isPrime,
      });
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
            rating: cheaper.rating,
            reviewCount: cheaper.reviewCount,
            deliveryTime: cheaper.deliveryTime,
            isPrime: cheaper.isPrime,
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

// ── Main entry point ───────────────────────────────────────────────────────────
export async function buildCart(input: BuildCartInput): Promise<CartProposal> {
  const { userId } = input;

  // 1. Load user context
  const ctx = await getUserContext(userId);
  const userProfile = {
    dietary: ctx.user.household.dietary ?? [],
    household: ctx.user.household.size ?? 2,
    budget: ctx.user.defaultBudget,
    recentProductNames: ctx.recentProducts.map((p) => p.name),
    learnedPrefs: ctx.learnedPrefs,
  };

  // 2. Parse intent (text or image)
  let intent: ParsedIntent;
  try {
    intent = await parseIntent(input, userProfile);
  } catch (err) {
    console.error("[nowAgent] parseIntent failed:", err);
    throw new Error("Could not understand your request. Please try again.");
  }

  // 2.5 Decompose Recipe if necessary (Phase 8)
  const isRecipeOrOccasion = intent.isRecipeOrOccasion || 
    intent.constraints?.occasion || 
    input.text?.toLowerCase().includes("recipe") || 
    input.text?.toLowerCase().includes("for ") || 
    input.text?.toLowerCase().includes("party");

  if (isRecipeOrOccasion && input.text) {
    try {
      console.log("[nowAgent] Recipe/Occasion detected, running decomposition...");
      const decompResult = await chatJSON(
        DECOMPOSE_RECIPE_SYSTEM,
        buildDecomposeRecipeUser(input.text, userProfile)
      );
      
      console.log("[nowAgent] Decomposition result:", JSON.stringify(decompResult, null, 2));

      // Merge the enhanced subNeeds and excluded staples back into intent
      if (decompResult && decompResult.subNeeds) {
        intent.subNeeds = decompResult.subNeeds.filter((sn: any) => !sn.isStaple);
        if (decompResult.excludedStaples && decompResult.excludedStaples.length > 0) {
          intent.assumptions = intent.assumptions || [];
          intent.assumptions.push(`Excluded staples from cart: ${decompResult.excludedStaples.join(", ")}`);
        }
      }
    } catch (err) {
      console.error("[nowAgent] decomposeRecipe failed, falling back to standard intent:", err);
    }
  }

  // 3. Handle clarifying question early return
  if (intent.clarifyingQuestion && (!input.text || input.text.length < 10)) {
    return {
      intentSummary: intent.summary,
      assumptions: intent.assumptions,
      items: [],
      total: 0,
      budget: intent.constraints?.budget ?? userProfile.budget ?? null,
      withinBudget: true,
      clarifyingQuestion: intent.clarifyingQuestion,
    };
  }

  // 4. Search candidates per sub-need
  intent.subNeeds = intent.subNeeds || [];
  const candidatesBySubNeed = await searchCandidates(intent, userProfile);
  console.log("[nowAgent] Parsed Intent:", JSON.stringify(intent, null, 2));
  console.log("[nowAgent] Candidates counts:", candidatesBySubNeed.map(c => `${c.subNeed}: ${c.products.length}`));

  // 5. Assemble cart via LLM (with one retry on Zod parse failure)
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

  // 6. Enforce availability / substitution (F7)
  proposal = await enforceAvailability(proposal);

  // 7. Enforce budget (F3) — deterministic swaps
  const effectiveBudget = intent.constraints?.budget ?? userProfile.budget ?? null;
  proposal = { ...proposal, budget: effectiveBudget };
  proposal = await enforceBudget(proposal, candidatesBySubNeed);

  // 8. Preserve clarifying question from the intent parser if it exists
  proposal.clarifyingQuestion = proposal.clarifyingQuestion || intent.clarifyingQuestion || null;

  return proposal;
}
