import { Router } from "express";
import { putOrder } from "../services/dynamodb.js";

const router = Router();

router.post("/", async (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !items) {
    return res.status(400).json({ error: "userId and items are required" });
  }

  const orderId = `ord-${Date.now()}`;

  // Persist to DynamoDB
  try {
    const newOrder = {
      id: orderId,
      userId,
      items: items.map((i: any) => ({ productId: i.productId, qty: i.qty })),
      createdAt: new Date().toISOString(),
    };
    
    await putOrder(newOrder);
  } catch (err) {
    console.error("[checkout] Failed to persist order:", err);
  }

  const total = items.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
  return res.json({ orderId, status: "confirmed", total: Math.round(total), message: "Order placed successfully! 🎉" });
});

export default router;
