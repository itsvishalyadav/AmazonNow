// frontend/src/lib/api.ts
// Typed API client for the Amazon Now backend.
// All calls are relative to VITE_API_BASE_URL (default: http://localhost:4001).
// For the Phase 5 acceptance demo, this matches the local backend port.
// ─────────────────────────────────────────────────────────────────────────────
import type { CartProposal, CartItem } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001';

// ── Generic fetch helper ─────────────────────────────────────────────────────
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── POST /api/intent ─────────────────────────────────────────────────────────
export interface IntentRequest {
  userId: string;
  text?: string;
  imageBase64?: string;
}

export function postIntent(req: IntentRequest): Promise<CartProposal> {
  return apiPost<CartProposal>('/api/intent', req);
}

// ── POST /api/auth/google/disconnect ─────────────────────────────────────────
export function postDisconnectCalendar(userId: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/api/auth/google/disconnect', { userId });
}

export function getCalendarStatus(userId: string): Promise<{ connected: boolean }> {
  return apiGet<{ connected: boolean }>(`/api/auth/google/status?userId=${userId}`);
}

// ── POST /api/emergency ──────────────────────────────────────────────────────
export interface EmergencyRequest {
  userId: string;
  scenario: string;
}

export function postEmergency(req: EmergencyRequest): Promise<CartProposal> {
  return apiPost<CartProposal>('/api/emergency', req);
}

export function getEmergencyScenarios(): Promise<{ scenarios: import('./types').EmergencyScenario[] }> {
  return apiGet<{ scenarios: import('./types').EmergencyScenario[] }>('/api/emergency/scenarios');
}

// ── POST /api/checkout ───────────────────────────────────────────────────────
export interface CheckoutRequest {
  userId: string;
  items: CartItem[];
}

export interface CheckoutResponse {
  orderId: string;
  status: 'confirmed';
  total: number;
}

export function postCheckout(req: CheckoutRequest): Promise<CheckoutResponse> {
  return apiPost<CheckoutResponse>('/api/checkout', req);
}

// ── POST /api/feedback ───────────────────────────────────────────────────────
export interface FeedbackRequest {
  userId: string;
  removed?: string[];   // product IDs
  added?: string[];
}

export function postFeedback(req: FeedbackRequest): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/api/feedback', req);
}

// ── GET /api/reorder/:userId ─────────────────────────────────────────────────
export interface ReorderResponse {
  candidates: CartItem[];
}

export function getReorder(userId: string): Promise<ReorderResponse> {
  return apiGet<ReorderResponse>(`/api/reorder/${userId}`);
}

// ── GET /api/proactive/:userId ───────────────────────────────────────────────
export interface ProactiveSuggestion {
  signal: string;
  proposal: CartProposal;
}

export interface ProactiveResponse {
  suggestions: ProactiveSuggestion[];
}

export function getProactive(userId: string): Promise<ProactiveResponse> {
  return apiGet<ProactiveResponse>(`/api/proactive/${userId}`);
}

// ── GET /api/history/:userId ─────────────────────────────────────────────────
export interface HistoryResponse {
  orders: {
    id: string;
    date: string;
    status: string;
    total: number;
    items: {
      productId: string;
      name: string;
      qty: number;
      image: string;
      price: number;
    }[];
  }[];
}

export function getHistory(userId: string): Promise<HistoryResponse> {
  return apiGet<HistoryResponse>(`/api/history/${userId}`);
}
