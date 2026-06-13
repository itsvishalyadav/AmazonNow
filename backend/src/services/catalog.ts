// backend/src/services/catalog.ts
// Phase 2: In-memory product catalog loaded from seed-catalog.json.
// Exposes `all()`, `getById()`, and `search()` for the agent pipeline.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import type { Product } from "../types/index.js";

// ── Load catalog ──────────────────────────────────────────────────────────────
const catalogPath = path.join(__dirname, "..", "data", "seed-catalog.json");
let _catalog: Product[] = [];

function loadCatalog(): Product[] {
  if (_catalog.length > 0) return _catalog;
  try {
    const raw = fs.readFileSync(catalogPath, "utf-8");
    _catalog = JSON.parse(raw) as Product[];
    console.log(`[catalog] Loaded ${_catalog.length} products from seed-catalog.json`);
  } catch (err) {
    console.error("[catalog] Failed to load seed-catalog.json:", err);
    _catalog = [];
  }
  return _catalog;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Return all products. */
export function all(): Product[] {
  return loadCatalog();
}

/** Return a single product by ID, or undefined. */
export function getById(id: string): Product | undefined {
  return loadCatalog().find((p) => p.id === id);
}

/** Filter products by category and/or subcategory. */
export function byCategory(category: string, subcategory?: string): Product[] {
  return loadCatalog().filter(
    (p) =>
      p.category.toLowerCase() === category.toLowerCase() &&
      (!subcategory || p.subcategory.toLowerCase() === subcategory.toLowerCase())
  );
}

/** Count of products loaded. */
export function count(): number {
  return loadCatalog().length;
}
