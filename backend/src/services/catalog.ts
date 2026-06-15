import type { Product } from "../types/index.js";
import { fetchFullCatalogFromDynamo } from "./dynamodb.js";

// ── In-memory catalog cache ───────────────────────────────────────────────────
let _catalog: Product[] = [];

// ── Initialization (called once during server startup) ────────────────────────
let catalogReadyResolver: () => void;
export const catalogReady = new Promise<void>((resolve) => {
  catalogReadyResolver = resolve;
});

export async function initCatalog(): Promise<void> {
  console.log("[catalog] Fetching catalog from DynamoDB...");
  _catalog = await fetchFullCatalogFromDynamo();

  // Enrich products with rating/review/Prime data if missing from DB.
  // Uses a deterministic hash so values are stable across restarts.
  for (const p of _catalog) {
    const hash = simpleHash(p.id);
    if (p.rating == null) {
      p.rating = 3.5 + (hash % 16) / 10;                         // 3.5 – 5.0
    }
    if (p.reviewCount == null) {
      p.reviewCount = 50 + (hash % 4950);                         // 50 – 5000
    }
    if (p.isPrime == null) {
      p.isPrime = hash % 3 !== 0;                                  // ~67% Prime
    }
    if (p.deliveryTime == null) {
      p.deliveryTime = p.isPrime ? "10 mins" : "30 mins";
    }
  }

  console.log(`[catalog] Loaded ${_catalog.length} products from DynamoDB cache`);
  catalogReadyResolver();
}

/** Simple deterministic hash from a string → positive integer. */
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── Public API (Synchronous cache access) ─────────────────────────────────────

/** Return all products. */
export function all(): Product[] {
  return _catalog;
}

/** Return a single product by ID, or undefined. */
export function getById(id: string): Product | undefined {
  return _catalog.find((p) => p.id === id);
}

/** Filter products by category and/or subcategory. */
export function byCategory(category: string, subcategory?: string): Product[] {
  return _catalog.filter(
    (p) =>
      p.category.toLowerCase() === category.toLowerCase() &&
      (!subcategory || p.subcategory.toLowerCase() === subcategory.toLowerCase())
  );
}

/** Count of products loaded. */
export function count(): number {
  return _catalog.length;
}
