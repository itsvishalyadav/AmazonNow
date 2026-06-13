// backend/src/routes/history.ts
// GET /api/history/:userId — Returns enriched order history for the frontend
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { getUserContextAllOrders } from "../services/userContext.js";
import { getById } from "../services/catalog.js";

const router = Router();

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const context = await getUserContextAllOrders(userId);
  
  // Enrich orders with product details (name, image, price)
  const enrichedOrders = context.allOrders.map(order => {
    let total = 0;
    const enrichedItems = order.items.map(item => {
      const product = getById(item.productId);
      const price = product?.price || 0;
      total += price * item.qty;
      
      // Attempt to pick an emoji based on the image URL or name
      const defaultEmoji = '📦';
      const isEmoji = product?.imageUrl && product.imageUrl.length <= 4;
      
      return {
        productId: item.productId,
        name: product?.name || 'Unknown Item',
        qty: item.qty,
        image: isEmoji ? product.imageUrl : defaultEmoji,
        price
      };
    });

    return {
      id: order.id,
      date: new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Delivered', // Hardcoded status for past orders
      total: Math.round(total),
      items: enrichedItems
    };
  });

  return res.json({ orders: enrichedOrders });
});

export default router;
