// backend/src/services/vectorSearch.ts
// Phase 3: In-memory cosine-similarity vector search over the product catalog.
// ─────────────────────────────────────────────────────────────────────────────

import { all as allProducts } from "./catalog.js";
import type { Product } from "../types/index.js";

// ── Cosine similarity ─────────────────────────────────────────────────────────
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

import { embedWithBedrock } from "./bedrock.js";

// ── Search filters ────────────────────────────────────────────────────────────
export interface SearchFilters {
  category?: string;        // e.g. "Dairy & Eggs"
  subcategory?: string;
  maxPrice?: number;        // INR
  dietary?: string[];       // must include all listed tags
  inStockOnly?: boolean;    // default true
}

// ── Main search function ──────────────────────────────────────────────────────
/**
 * Semantic search over the in-memory product catalog.
 *
 * 1. Embeds the query via AgentRouter (falls back to local stub if API is down).
 * 2. Computes cosine similarity against every product's stored embedding.
 * 3. Applies filters, sorts by score, returns top-K.
 */
export async function search(
  query: string,
  filters: SearchFilters = {},
  topK = 8
): Promise<Array<Product & { _score: number }>> {
  const catalog = allProducts();
  if (catalog.length === 0) {
    console.warn("[vectorSearch] Catalog is empty");
    return [];
  }

  // 1. Apply strict filters first (BM25 concept) to drastically reduce the search space
  const { category, subcategory, maxPrice, dietary = [], inStockOnly = true } = filters;
  const candidates = catalog.filter((p) => {
    if (inStockOnly && !p.inStock) return false;
    if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
    if (subcategory && p.subcategory.toLowerCase() !== subcategory.toLowerCase()) return false;
    if (maxPrice !== undefined && p.price > maxPrice) return false;
    if (dietary.length > 0) {
      const isFoodCategory = !["Health & OTC", "Personal Care", "Home & Cleaning", "Pet Care", "Stationery"].includes(p.category);
      if (isFoodCategory && !dietary.every((d) => p.dietary.includes(d))) {
        return false;
      }
    }
    return true;
  });

  if (candidates.length === 0) return [];

  // 2. Embed the query strictly using our new Bedrock embedder
  const queryVec = await embedWithBedrock(query);

  // 3. Score and sort ONLY the filtered candidates (O(Filtered_N) instead of O(Total_N))
  const scored = candidates
    .filter((p) => p.embedding && p.embedding.length > 0)
    .map((p) => ({
      ...p,
      _score: cosineSim(queryVec, p.embedding!),
    }))
    .sort((a, b) => b._score - a._score);

  return scored.slice(0, topK);
}

// ── Subcategory-constrained search (for substitution) ─────────────────────────
/**
 * Find the best in-stock substitute in the same subcategory, excluding a product.
 */
export async function findSubstitute(
  product: Product,
  maxPrice?: number
): Promise<Product | null> {
  const query = `${product.name} ${product.subcategory} ${product.tags.join(" ")}`;
  const results = await search(query, {
    subcategory: product.subcategory,
    maxPrice,
    inStockOnly: true,
  }, 5);

  const alt = results.find((p) => p.id !== product.id);
  return alt ?? null;
}
