// backend/src/services/vectorSearch.ts
// Phase 3: In-memory cosine-similarity vector search over the product catalog.
// ─────────────────────────────────────────────────────────────────────────────

import { all as allProducts } from "./catalog.js";
import type { Product } from "../types/index.js";

// ── Cosine similarity ─────────────────────────────────────────────────────────
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const valA = a[i] || 0;
    const valB = b[i] || 0;
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
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

// Minimum cosine similarity threshold — below this, the match is semantically garbage.
// This prevents the LLM from receiving completely irrelevant candidates.
// Note: Titan Text v2 embeddings often produce scores around 0.25-0.30 for short queries vs long product strings.
const MIN_SIMILARITY = 0.25;

// ── Main search function ──────────────────────────────────────────────────────
/**
 * Semantic search over the in-memory product catalog.
 *
 * 1. Embeds the query via AgentRouter (falls back to local stub if API is down).
 * 2. Computes cosine similarity against every product's stored embedding.
 * 3. Applies filters, sorts by score, returns top-K.
 * 4. Filters out any result below MIN_SIMILARITY to avoid garbage matches.
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
    return true;
  });

  if (candidates.length === 0) return [];

  // 2. Embed the query strictly using our new Bedrock embedder
  const queryVec = await embedWithBedrock(query);

  // 3. Score and sort ONLY the filtered candidates (O(Filtered_N) instead of O(Total_N))
  const scored = candidates
    .filter((p) => p.embedding && p.embedding.length > 0)
    .map((p) => {
      let score = cosineSim(queryVec, p.embedding!);
      
      // Soft-filter: Penalize items that violate dietary constraints so they only appear if they are an extremely strong exact match
      if (dietary.length > 0) {
        const isFoodCategory = !["Health & OTC", "Personal Care", "Home & Cleaning", "Pet Care", "Stationery"].includes(p.category);
        if (isFoodCategory && !dietary.every((d) => p.dietary.includes(d))) {
          score -= 0.2;
        }
      }

      return {
        ...p,
        _score: score,
      };
    })
    .sort((a, b) => b._score - a._score)
    .filter((p) => p._score >= MIN_SIMILARITY);

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
