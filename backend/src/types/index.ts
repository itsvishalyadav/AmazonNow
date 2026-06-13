// backend/src/types/index.ts
// Shared TypeScript types + Zod validation schemas.
// These mirror the agent.md §5 and §9 definitions exactly.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from "zod";

// ── Product ───────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand?: string;
  price: number;          // INR
  unit: string;           // e.g. "500g", "1L", "6 pcs"
  packSize?: string;      // e.g. "Pack of 6"
  tags: string[];
  dietary: string[];      // "vegan" | "vegetarian" | "gluten-free" | "dairy-free" | "organic" | "jain"
  inStock: boolean;
  popularity: number;     // 0–1
  imageUrl: string;
  embedding?: number[];
  _stub?: boolean;        // true when embeddings are local stubs, not real model vectors
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email?: string;
  city?: string;
  household: {
    size: number;
    dietary: string[];
    budgetSensitivity: "low" | "med" | "high";
  };
  defaultBudget?: number;
  learnedPrefs?: {
    avoid: string[];   // product IDs or category slugs
    prefer: string[];
  };
}

// ── Order ─────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  userId: string;
  items: { productId: string; qty: number }[];
  createdAt: string;      // ISO 8601
}

// ── CartItem ──────────────────────────────────────────────────────────────────
export const CartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  qty: z.number().int().positive(),
  price: z.number().positive(),
  reason: z.string(),           // why it's here (trust / explainability layer)
  confidence: z.number().min(0).max(1),
  substituteFor: z.string().optional(),   // F7: out-of-stock original name
  nudge: z.string().optional(),           // F11: unit-economics tip
  dietaryFlag: z.string().optional(),     // F10: e.g. "high sugar"
  imageUrl: z.string().optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

// ── Swap (F3 budget rebalancing) ──────────────────────────────────────────────
export const SwapSchema = z.object({
  from: z.string(),     // original product name
  to: z.string(),       // cheaper replacement name
  saved: z.number(),    // INR saved
  reason: z.string(),
});
export type Swap = z.infer<typeof SwapSchema>;

// ── CartProposal ──────────────────────────────────────────────────────────────
export const CartProposalSchema = z.object({
  intentSummary: z.string(),
  assumptions: z.array(z.string()),
  items: z.array(CartItemSchema),
  total: z.number(),
  budget: z.number().nullable(),
  withinBudget: z.boolean(),
  rebalance: z.array(SwapSchema).optional(),
  clarifyingQuestion: z.string().nullable(),
});
export type CartProposal = z.infer<typeof CartProposalSchema>;

// ── ParsedIntent (internal) ───────────────────────────────────────────────────
// Returned by the parse_intent step before search.
export interface ParsedIntent {
  summary: string;                // human-readable restatement of the need
  subNeeds: SubNeed[];            // decomposed search queries
  constraints: {
    budget?: number;
    dietary?: string[];
    servings?: number;
    occasion?: string;
  };
  assumptions: string[];
  clarifyingQuestion?: string;    // AT MOST ONE
}

export interface SubNeed {
  query: string;     // e.g. "milk for breakfast"
  qty?: number;      // e.g. 2 (litres / packs)
  category?: string; // optional hint for filtering
}
