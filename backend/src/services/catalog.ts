import type { Product } from "../types/index.js";
import { fetchFullCatalogFromDynamo } from "./dynamodb.js";

// ── In-memory catalog cache ───────────────────────────────────────────────────
let _catalog: Product[] = [];

// ── Initialization (called once during server startup) ────────────────────────
export async function initCatalog(): Promise<void> {
  console.log("[catalog] Fetching catalog from DynamoDB...");
  _catalog = await fetchFullCatalogFromDynamo();
  console.log(`[catalog] Loaded ${_catalog.length} products from DynamoDB cache`);
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
