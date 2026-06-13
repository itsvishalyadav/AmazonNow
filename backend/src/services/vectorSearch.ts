// backend/src/services/vectorSearch.ts
// Phase 3: In-memory cosine-similarity vector search over the product catalog.
// ─────────────────────────────────────────────────────────────────────────────
import { embed } from "./agentrouter.js";
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

// ── Local stub embedding (mirrors generate-catalog-local.ts logic) ────────────
// Used as a fallback when AgentRouter embed call fails, ensuring search works
// even with STUB embeddings in the catalog.
const VOCAB = [
  "milk","curd","paneer","cheese","butter","ghee","cream","egg","bread","flour",
  "rice","dal","pulses","oil","spice","masala","salt","sugar","tea","coffee",
  "juice","water","drink","snack","biscuit","chip","noodle","pasta","soup","sauce",
  "shampoo","soap","detergent","cleaner","dishwash","toothpaste","toothbrush",
  "baby","diaper","wipe","food","cereal","ors","vitamin","supplement","painkiller",
  "fruit","vegetable","tomato","potato","onion","garlic","ginger","lemon","banana",
  "apple","mango","wheat","oats","cornflakes","muesli","jam","ketchup","pickle",
  "yogurt","lassi","buttermilk","protein","fiber","vegan","organic","gluten",
  "amul","tata","nestle","itc","hul","dettol","surf","dove","colgate","maggi",
  "britannia","parle","haldiram","patanjali","dabur","himalaya","johnson","pepsico",
  "fresh","instant","ready","healthy","natural","cold","hot","sweet","salty","spicy",
  "breakfast","lunch","dinner","snacking","cooking","baking","cleaning","hygiene",
  "pack","bottle","bag","box","can","sachet","kg","gram","liter","ml","piece",
  "daily","weekly","essential","staple","premium","economy","value","family","size",
  "indian","regional","national","brand","generic","local","imported","certified",
  "grocery","dairy","beverage","personal","care","home","baby","health","otc",
  "vegetarian","jain","diabetic","allergen","low","high","calorie","sodium","fat",
];

function localEmbed(text: string): number[] {
  const lower = text.toLowerCase();
  const vec = new Array(128).fill(0);
  VOCAB.forEach((word, i) => {
    if (i < 112 && lower.includes(word)) {
      vec[i] = 1;
      if (i + 1 < 112) vec[i + 1] += 0.3;
      if (i - 1 >= 0) vec[i - 1] += 0.3;
    }
  });
  for (let i = 0; i < text.length && i < 32; i++) {
    vec[112 + (i % 16)] += text.charCodeAt(i) / 1000;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => Math.round((v / norm) * 10000) / 10000);
}

// Global cache to avoid re-computing vectors for common queries
const embeddingCache = new Map<string, number[]>();

function getCachedLocalEmbed(text: string): number[] {
  if (embeddingCache.has(text)) return embeddingCache.get(text)!;
  const vec = localEmbed(text);
  embeddingCache.set(text, vec);
  return vec;
}

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
    if (dietary.length > 0 && !dietary.every((d) => p.dietary.includes(d))) return false;
    return true;
  });

  if (candidates.length === 0) return [];

  // 2. Embed the query strictly using our cached local model (since AgentRouter has no embedding models)
  const queryVec = getCachedLocalEmbed(query);

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
