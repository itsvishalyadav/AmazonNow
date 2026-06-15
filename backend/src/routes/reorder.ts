// backend/src/routes/reorder.ts
// Phase 11 (F6): GET /api/reorder/:userId — hybrid reorder prediction.
// Lane 1: Deterministic "frequently bought" (ordered 3+ times in 60 days).
// Lane 2: LLM-predicted consumption for single-purchase items.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { getUserContextAllOrders } from "../services/userContext.js";
import { getById } from "../services/catalog.js";
import { chatJSON } from "../services/agentrouter.js";
import type { CartItem } from "../types/index.js";

const router = Router();

// In-memory cache for reorder predictions to save LLM credits
const reorderCache = new Map<string, { timestamp: number; candidates: CartItem[] }>();

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const ctx = await getUserContextAllOrders(userId);

  const allOrders = ctx.allOrders;
  const nowMs = Date.now();
  const DAY_MS = 86400000;

  // Flatten and format recent orders for analysis
  // Limit to orders within the last 60 days
  const recentOrders = allOrders.filter(o => (nowMs - new Date(o.createdAt).getTime()) <= 60 * DAY_MS);
  
  if (recentOrders.length === 0) {
    return res.json({ candidates: [] });
  }

  const mostRecentOrderId = recentOrders[0].id || "none";
  const cacheKey = `${userId}_${mostRecentOrderId}`;
  const cached = reorderCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) {
    return res.json({ candidates: cached.candidates });
  }

  // ── Group by product to calculate purchase history ────────────────────────
  const productHistory = new Map<string, { name: string, daysAgoList: number[], totalQty: number }>();
  for (const o of recentOrders) {
    const daysAgo = Math.floor((nowMs - new Date(o.createdAt).getTime()) / DAY_MS);
    for (const i of o.items) {
      if (!productHistory.has(i.productId)) {
        productHistory.set(i.productId, { name: getById(i.productId)?.name || "Unknown", daysAgoList: [], totalQty: 0 });
      }
      const entry = productHistory.get(i.productId)!;
      entry.daysAgoList.push(daysAgo);
      entry.totalQty += i.qty || 1;
    }
  }

  // ── LANE 1: Deterministic "Frequently Bought" ─────────────────────────────
  // Items ordered 2+ times. We calculate the average interval between orders.
  const frequentlyBought: CartItem[] = [];
  const singlePurchaseItems: Array<{ productId: string; name: string; daysSinceLastOrder: number }> = [];

  for (const [productId, data] of productHistory) {
    const sorted = data.daysAgoList.sort((a, b) => a - b); // most recent first
    const daysSinceLastOrder = sorted[0]; // most recent purchase
    const orderCount = sorted.length;

    const product = getById(productId);
    if (!product || !product.inStock) continue;

    if (orderCount >= 2) {
      // Calculate average interval between orders
      const intervals: number[] = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        intervals.push(sorted[i + 1] - sorted[i]);
      }
      const avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);

      // Is it time to reorder? (daysSinceLastOrder >= 70% of avg interval)
      const isDue = daysSinceLastOrder >= avgInterval * 0.7;

      if (isDue) {
        frequentlyBought.push({
          productId: product.id,
          name: product.name,
          qty: 1,
          price: product.price,
          reason: `You buy this every ~${avgInterval} day${avgInterval !== 1 ? 's' : ''} (ordered ${orderCount} times recently), and you last ordered it ${daysSinceLastOrder} day${daysSinceLastOrder !== 1 ? 's' : ''} ago.`,
          confidence: Math.min(0.95, 0.7 + orderCount * 0.05),
          imageUrl: product.imageUrl,
          rating: product.rating,
          reviewCount: product.reviewCount,
          isPrime: product.isPrime,
          deliveryTime: product.deliveryTime,
        });
      }
    } else {
      // Single purchase — needs LLM estimation
      singlePurchaseItems.push({
        productId,
        name: data.name,
        daysSinceLastOrder,
      });
    }
  }

  // ── LANE 2: LLM-estimated consumption for single-purchase items ───────────
  let llmPredictions: CartItem[] = [];

  // Limit to 20 most recent single-purchase items to avoid LLM token limits
  const llmCandidates = singlePurchaseItems
    .sort((a, b) => a.daysSinceLastOrder - b.daysSinceLastOrder)
    .slice(0, 20);

  if (llmCandidates.length > 0) {
    const systemPrompt = `You are a grocery consumption estimator for Amazon Now.
You will receive a list of products a customer bought ONCE in the last 60 days, along with their household size.

Your job: Estimate the typical consumption rate (in days) for each product, and determine if the customer is likely running low.

CRITICAL RULES:
1. Estimate how many days a household of the given size would take to consume each product.
2. Compare 'daysSinceLastOrder' to your estimated consumption days.
3. ONLY include items where daysSinceLastOrder >= estimatedConsumptionDays * 0.7 (they're running low).
4. If they bought it very recently compared to consumption time, DO NOT include it.
5. Be realistic: a 1kg bag of rice lasts 2-3 weeks for a family of 4, not 3 days.

Output ONLY a JSON array:
[
  {
    "productId": "string",
    "estimatedConsumptionDays": 14,
    "daysSinceLastOrder": 16,
    "confidence": 0.8,
    "reason": "A household of N typically consumes this in X days, and you last ordered it Y days ago."
  }
]

If NO items are running low, return an empty array: []`;

    const userPrompt = {
      householdSize: ctx.user.household.size,
      dietary: ctx.user.household.dietary,
      singlePurchaseItems: llmCandidates,
    };

    try {
      const llmResponse = await chatJSON(systemPrompt, userPrompt);
      const predictions = Array.isArray(llmResponse) ? llmResponse : [];

      for (const pred of predictions) {
        if (!pred.productId || typeof pred.confidence !== 'number') continue;
        
        // Hard filter: enforce the math
        if (typeof pred.estimatedConsumptionDays === 'number' && typeof pred.daysSinceLastOrder === 'number') {
          if (pred.daysSinceLastOrder < pred.estimatedConsumptionDays * 0.7) {
            continue;
          }
        }

        const product = getById(pred.productId);
        if (product && product.inStock) {
          llmPredictions.push({
            productId: product.id,
            name: product.name,
            qty: 1,
            price: product.price,
            reason: pred.reason || "You might be running low on this item.",
            confidence: pred.confidence,
            imageUrl: product.imageUrl,
            rating: product.rating,
            reviewCount: product.reviewCount,
            isPrime: product.isPrime,
            deliveryTime: product.deliveryTime,
          });
        }
      }
    } catch (error) {
      console.error("[reorder] LLM prediction failed for single-purchase items:", error);
      // Continue with just the deterministic results
    }
  }

  // ── Merge both lanes ─────────────────────────────────────────────────────
  const allCandidates = [...frequentlyBought, ...llmPredictions];
  
  // Sort by confidence (highest first), deduplicate
  const seen = new Set<string>();
  const finalCandidates: CartItem[] = [];
  for (const c of allCandidates.sort((a, b) => b.confidence - a.confidence)) {
    if (!seen.has(c.productId)) {
      seen.add(c.productId);
      finalCandidates.push(c);
    }
  }

  const topCandidates = finalCandidates.slice(0, 8);

  // Save to cache
  reorderCache.set(cacheKey, { timestamp: Date.now(), candidates: topCandidates });

  return res.json({ candidates: topCandidates });
});

export default router;
