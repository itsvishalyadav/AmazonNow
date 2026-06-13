// backend/src/routes/checkout.ts
// Phase 5: POST /api/checkout — mock order confirmation.
// Body: { userId: string, items: CartItem[] }
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import fs from "fs";
import path from "path";

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
    const existing = JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
    existing.push({
      id: orderId,
      userId,
      items: items.map((i: any) => ({ productId: i.productId, qty: i.qty })),
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(ordersPath, JSON.stringify(existing, null, 2));
  } catch {
    // Non-fatal — prototype doesn't need perfect persistence
  }

  return res.json({ orderId, status: "confirmed", message: "Order placed successfully! 🎉" });
});

export default router;
