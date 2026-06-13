// backend/src/routes/reorder.ts
// Phase 11 (F6): GET /api/reorder/:userId — consumption-rate prediction.
// Returns products likely running low based on order history.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { getUserContext } from "../services/userContext.js";
import { getById } from "../services/catalog.js";
import type { CartItem, Product } from "../types/index.js";

const router = Router();

router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const ctx = getUserContext(userId);

  // Build consumption frequency map across all orders
  const allOrders = ctx.recentOrders; // extend to all orders if needed
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

    dates.sort((a, b) => a - b);
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / DAY_MS);
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const daysSinceLast = (nowMs - dates[dates.length - 1]) / DAY_MS;

    // If it's been as long as the average interval, it's likely running low
    if (daysSinceLast >= avgInterval * 0.8) {
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
        });
      }
    }
  });

  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence);

  return res.json({ candidates: candidates.slice(0, 8) });
});

export default router;
