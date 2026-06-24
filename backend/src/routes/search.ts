import { Router } from "express";
import { search } from "../services/vectorSearch.js";

const router = Router();

router.post("/", async (req, res) => {
  const { query, topK = 1 } = req.body;

  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  try {
    const products = await search(query, { inStockOnly: true }, topK);
    
    if (products.length > 0) {
      const items = products.map(p => ({
        productId: p.id,
        name: p.name,
        qty: 1,
        price: p.price,
        category: p.category,
        reason: "Added manually to your cart.",
        confidence: 1.0,
        imageUrl: p.imageUrl,
        rating: p.rating,
        reviewCount: p.reviewCount,
        deliveryTime: p.deliveryTime,
        isPrime: p.isPrime,
      }));
      
      return res.json({ item: items[0], items });
    } else {
      return res.json({ item: null, items: [] });
    }
  } catch (err: any) {
    console.error("[POST /api/search] Error:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

export default router;
