// frontend/src/lib/types.ts
// Shared TypeScript types mirroring backend/src/types/index.ts
// These are the shapes the frontend receives from the API.
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  category?: string;
  reason: string;               // trust layer — why this item
  confidence: number;           // 0–1
  substituteFor?: string;       // F7: original name if swapped
  nudge?: string;               // F11: unit-economics tip
  dietaryFlag?: string;         // F10: e.g. "high sugar"
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  isPrime?: boolean;
  alternatives?: {
    id: string;
    name: string;
    price: number;
    reason: string;
  }[];
}

export interface Swap {
  from: string;
  to: string;
  saved: number;               // INR saved
  reason: string;
}

export interface OccasionTheme {
  name: string;
  emoji: string;
  colorGradient: string;
}

export interface CartProposal {
  intentSummary: string;
  assumptions: string[];
  items: CartItem[];
  total: number;
  budget: number | null;
  withinBudget: boolean;
  rebalance?: Swap[];           // F3: shown when budget exceeded then fixed
  occasion?: OccasionTheme;
  clarifyingQuestion: string | null;
}

export interface ReorderCandidate extends CartItem {}

export interface EmergencyScenario {
  id: string;
  label: string;
  emoji: string;
  description: string;
}
