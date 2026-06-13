// backend/src/routes/checkout.ts
// Phase 5: POST /api/checkout — mock order confirmation.
// Body: { userId: string, items: CartItem[] }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import fs from "fs";
import path from "path";
import { addOrderToContext } from "../services/userContext.js";

const ordersPath = path.join(__dirname, "..", "data", "seed-orders.json");

const router = Router();

router.post("/", (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !items) {
    return res.status(400).json({ error: "userId and items are required" });
  }

  const orderId = `ord-${Date.now()}`;

  // Persist to seed-orders.json (in-memory prototype)
  try {
    const newOrder = {
      id: orderId,
      userId,
      items: items.map((i: any) => ({ productId: i.productId, qty: i.qty })),
      createdAt: new Date().toISOString(),
    };
    
    const existing = JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
    existing.push(newOrder);
    fs.writeFileSync(ordersPath, JSON.stringify(existing, null, 2));

    // Update in-memory cache so history tab sees it immediately
    addOrderToContext(newOrder);
  } catch {
    // Non-fatal — prototype doesn't need perfect persistence
  }

  const total = items.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
  return res.json({ orderId, status: "confirmed", total: Math.round(total), message: "Order placed successfully! 🎉" });
});

export default router;
