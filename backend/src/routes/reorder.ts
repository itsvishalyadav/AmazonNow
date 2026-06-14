// backend/src/routes/reorder.ts
// Phase 11 (F6): GET /api/reorder/:userId — consumption-rate prediction.
// Returns products likely running low based on order history.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { getUserContextAllOrders } from "../services/userContext.js";
import { getById } from "../services/catalog.js";
import type { CartItem, Product } from "../types/index.js";

const router = Router();

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const ctx = await getUserContextAllOrders(userId);

  // Build consumption frequency map across all orders
  const allOrders = ctx.allOrders;
  const freqMap = new Map<string, { count: number; lastSeen: number; avgInterval: number }>();

  // Load all orders (not just recent 5)
  // For prototype we use recentOrders — sufficient for demo
  const orderDates: Map<string, number[]> = new Map();

  for (const order of allOrders) {
    const orderTime = new Date(order.createdAt).getTime();
    for (const item of order.items) {
      if (!orderDates.has(item.productId)) orderDates.set(item.productId, []);
      orderDates.get(item.productId)!.push(orderTime);
    }
  }

  const nowMs = Date.now();
  const DAY_MS = 86400000;
  const candidates: CartItem[] = [];

  orderDates.forEach((dates, productId) => {
    if (dates.length < 2) return; // need at least 2 orders to estimate interval

    // Remove duplicate days to prevent avgInterval from becoming 0 if user checked out multiple times today
    const uniqueDays = [...new Set(dates.map(d => Math.floor(d / DAY_MS)))].sort((a, b) => a - b);
    
    if (uniqueDays.length < 2) return; // need at least 2 distinct days

    const intervals: number[] = [];
    for (let i = 1; i < uniqueDays.length; i++) {
      intervals.push(uniqueDays[i] - uniqueDays[i - 1]);
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const daysSinceLast = Math.floor(nowMs / DAY_MS) - uniqueDays[uniqueDays.length - 1];

    // If it's been as long as the average interval, it's likely running low
    // Require at least a 2-day average interval to prevent spamming
    if (avgInterval >= 2 && daysSinceLast >= avgInterval * 0.8) {
      const product = getById(productId);
      if (product && product.inStock) {
        const confidence = Math.min(0.95, daysSinceLast / avgInterval);
        candidates.push({
          productId,
          name: product.name,
          qty: 1,
          price: product.price,
          reason: `You typically reorder this every ${Math.round(avgInterval)} days — last ordered ${Math.round(daysSinceLast)} days ago.`,
          confidence: Math.round(confidence * 100) / 100,
          imageUrl: product.imageUrl,
          rating: product.rating,
          reviewCount: product.reviewCount,
          isPrime: product.isPrime,
          deliveryTime: product.deliveryTime,
        });
      }
    }
  });

  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence);

  return res.json({ candidates: candidates.slice(0, 8) });
});

export default router;
