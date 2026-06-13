# Amazon Now — Optimized Implementation Plan (v2)

> Revised based on actual build experience through Phases 0–5. This plan preserves all completed work, consolidates future phases based on real-world lessons (proxy limitations, performance, what's already built), and reduces total phases from 14 to 10.

---

## Current State Audit

### ✅ Completed (Phases 0–5)

| Phase | Status | What's Built |
|-------|--------|-------------|
| 0 — Setup | ✅ Done | Monorepo: `frontend/` (Vite+React+TS), `backend/` (Express+TS). All deps installed. |
| 1 — Data | ✅ Done | `seed-catalog.json` (209 products, 128-dim local embeddings), `seed-user.json`, `seed-orders.json` |
| 2 — AgentRouter Client | ✅ Done | `agentrouter.ts` with `chatJSON`, `chatVisionJSON`, `embed`, `safeJSON` + JSON extraction. Proxy at `:8318` |
| 3 — Vector Search | ✅ Done | `vectorSearch.ts` — cosine similarity with local fallback embeddings. Tested ✅ |
| 4 — Now Agent + `/api/intent` | ✅ Done | Full orchestrated pipeline: `parseIntent` → `searchCandidates` → `assembleCart` → `enforceAvailability` → `enforceBudget`. Tested ✅ |
| 5 — Frontend Hero | ✅ Done | `IntentBar`, `CartProposalCard`, `ItemRow`, `LoadingState`, `OrderConfirm`, `RebalanceBanner`. Full flow works ✅ |

### 🔨 Already Built Ahead of Schedule (Backend Routes Only — No Frontend)

These backend routes were scaffolded during earlier phases but **lack frontend integration and proper testing**:

| Route | File | Status |
|-------|------|--------|
| `POST /api/emergency` | [emergency.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/routes/emergency.ts) | ✅ Backend done — 5 scenario presets |
| `POST /api/feedback` | [feedback.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/routes/feedback.ts) | ✅ Backend done — updates `learnedPrefs` |
| `GET /api/reorder/:userId` | [reorder.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/routes/reorder.ts) | ✅ Backend done — consumption-rate logic |
| `GET /api/proactive/:userId` | [proactive.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/routes/proactive.ts) | ✅ Backend done — festival + season signals |
| `POST /api/checkout` | [checkout.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/routes/checkout.ts) | ✅ Backend done — mock order confirmation |

### ⚠️ Known Issues to Fix

1. **Performance:** End-to-end intent takes ~50-60s. Root causes:
   - `deepseek-v4-pro` is slow for large JSON generation
   - Two sequential LLM calls (parse + assemble)
   - No response caching
2. **Proxy lacks embedding models** — `text-embedding-ada-002` returns 503. Local 128-dim fallback works fine.
3. **Port conflicts** — Backend proxy (`:8318`) + Express (`:4001`) can collide on restart.

---

## Guiding Principles (Updated)

1. **Local-first search**: Use the 128-dim local embeddings exclusively. Remove dependency on embedding API calls. This eliminates a network round-trip per sub-need and makes search instant.
2. **Speed over sophistication**: Use `deepseek-v4-flash` (already switched in `.env`). Condense prompts to reduce token generation time.
3. **One LLM call where possible**: Merge `parseIntent` + `assembleCart` into a single call for simple queries; keep two-step only for complex/ambiguous intents.
4. **Build frontend for already-done backends**: Emergency, reorder, proactive routes are done — just need UI components.
5. **Demo-driven phasing**: Order remaining work by visual impact for the demo video.

---

## Phase 6 — Performance & Stability Hardening ⚡

**Goal:** Reduce intent-to-cart latency from ~60s to <15s. Fix port conflicts.

### Backend Changes

#### [MODIFY] [nowAgent.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/agent/nowAgent.ts)
- Add timing logs (`console.time` / `console.timeEnd`) to each pipeline step
- Add an LLM response cache (Map keyed by hash of user input) — cache for 5 minutes
- For simple queries (≤3 sub-needs), merge parse + assemble into a single LLM call with a combined prompt
- Reduce `topK` from 8 to 5 in `searchCandidates` — fewer candidates = shorter LLM input = faster generation

#### [MODIFY] [prompts.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/agent/prompts.ts)
- Add a `FAST_CART_SYSTEM` combined prompt for single-call mode
- Shorten `reason` instruction: "one SHORT phrase" instead of "one-line reason"
- Remove verbose product fields from candidate listing (drop `popularity`, `brand` — they add tokens but rarely change picks)

#### [MODIFY] [vectorSearch.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/services/vectorSearch.ts)
- Force local embedding path always (bypass the `embed()` API call entirely)
- This makes search fully synchronous — 0ms network latency

#### [MODIFY] [index.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/index.ts)
- Wrap proxy startup in try/catch with `EADDRINUSE` handling (skip if port already bound)
- Add graceful shutdown handler for `SIGTERM`/`SIGINT`

#### [MODIFY] [proxy.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/proxy.ts)
- Add `.on('error')` handler for `EADDRINUSE` — log warning instead of crashing

### Frontend Changes

#### [MODIFY] [LoadingState.tsx](file:///c:/My%20Work/Web/AmazonNow/frontend/src/components/LoadingState.tsx)
- Add elapsed time counter ("Building your cart... 5s")
- Add step indicators: "Understanding your need..." → "Finding products..." → "Assembling cart..."

**Acceptance:**
- [ ] `console.time` logs show each step's duration
- [ ] Simple queries ("breakfast for 2") complete in <15s
- [ ] Backend restarts cleanly without port-in-use crashes
- [ ] Loading state shows real-time progress

---

## Phase 7 — Emergency Mode + Proactive UI (F5, F6, F12)

**Goal:** Surface the already-built backend routes in the frontend. Maximum visual impact, minimum backend work.

### Frontend Changes

#### [NEW] `frontend/src/components/EmergencyChips.tsx`
- Row of one-tap scenario buttons: 🤒 Sick, 🎉 Guests, 🏠 Staples, 👶 Baby, ⚡ Power Cut
- Each calls `POST /api/emergency` with the matching scenario
- Renders result in the existing `CartProposalCard`
- Animated entrance, pill-shaped buttons with icons

#### [NEW] `frontend/src/components/ReorderStrip.tsx`
- Horizontal scroll strip: "Running low?" with product cards
- Calls `GET /api/reorder/user-demo-001` on mount
- Each card shows product name, price, days since last order, "Add to cart" button
- Glassmorphism card style

#### [NEW] `frontend/src/components/ProactiveBanner.tsx`
- Dismissible banner at top of home page
- Calls `GET /api/proactive/user-demo-001` on mount
- Shows seasonal/festival suggestion with "Build this cart" CTA
- Gradient background matching the signal theme (summer=orange, monsoon=blue, winter=warm)

#### [MODIFY] [Home.tsx](file:///c:/My%20Work/Web/AmazonNow/frontend/src/pages/Home.tsx)
- Add `EmergencyChips` below the intent bar (visible in idle state)
- Add `ReorderStrip` at bottom of idle hero section
- Add `ProactiveBanner` at the very top (above header, dismissible)

#### [MODIFY] [index.css](file:///c:/My%20Work/Web/AmazonNow/frontend/src/index.css)
- Styles for emergency chips, reorder strip, proactive banner

**Acceptance:**
- [ ] Emergency chips visible on home screen; tapping "Sick" returns a medicine cart
- [ ] Reorder strip shows products from order history with "days since" labels
- [ ] Proactive banner appears for current season (June = Summer)
- [ ] All three integrate into the existing cart display flow

---

## Phase 8 — Multimodal Intent: Camera + Voice (F2)

**Goal:** The headline demo moment — photo → cart.

### Frontend Changes

#### [MODIFY] [IntentBar.tsx](file:///c:/My%20Work/Web/AmazonNow/frontend/src/components/IntentBar.tsx)
- **Camera button**: Opens file picker (accept `image/*`), converts to base64, sends alongside text
- **Mic button**: Uses `window.SpeechRecognition` API → transcribes to text → fills input
- Add image thumbnail preview below the input bar when an image is selected
- Add pulsing mic animation while recording

### Backend Changes
- Already implemented: `chatVisionJSON` in agentrouter.ts, vision path in `parseIntent`
- No backend changes needed

**Acceptance:**
- [ ] Uploading a photo of an empty fridge produces a restock cart
- [ ] Uploading a photo of a handwritten list produces those items
- [ ] Mic button transcribes speech to text and submits
- [ ] Image preview shows below the intent bar before submission

---

## Phase 9 — Learn from Edits + Cart Polish (F9, F8)

**Goal:** The AI gets smarter from user behavior. Cart shows alternatives.

### Frontend Changes

#### [MODIFY] [ItemRow.tsx](file:///c:/My%20Work/Web/AmazonNow/frontend/src/components/ItemRow.tsx)
- When an item is removed (×), call `POST /api/feedback` with `removed: [productId]`
- Show a subtle toast: "Got it — we'll remember this preference"
- Add "Show alternatives" expander for low-confidence items (confidence < 0.7)

#### [MODIFY] [CartProposalCard.tsx](file:///c:/My%20Work/Web/AmazonNow/frontend/src/components/CartProposalCard.tsx)
- Track removed items in state
- Pass feedback callback to ItemRow
- Show quantity +/- controls per item (client-side total recalculation)

### Backend Changes

#### [MODIFY] [userContext.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/services/userContext.ts)
- Include `learnedPrefs.avoid` in the prompt context so the LLM deprioritizes avoided products
- Already stores prefs — just needs to feed them into the pipeline

#### [MODIFY] [nowAgent.ts](file:///c:/My%20Work/Web/AmazonNow/backend/src/agent/nowAgent.ts)
- Pass `learnedPrefs` to `buildAssembleCartUser` prompt
- In `searchCandidates`, demote products in `avoid` list (reduce score by 50%)

**Acceptance:**
- [ ] Removing an item fires feedback API and shows toast
- [ ] Re-running a similar query shows the removed item deprioritized
- [ ] Low-confidence items show an expandable alternatives section
- [ ] Quantity controls update the total in real-time

---

## Phase 10 — Deploy + Demo Deliverables

**Goal:** Live URL + polished demo video assets.

### Deployment (Pick one path)

#### Option A: Vercel (Recommended — Fastest)
- Frontend: `vite build` → deploy to Vercel (auto-detected)
- Backend: Deploy as a Vercel Serverless Function or separate Node service on Railway/Render
- Set `VITE_API_BASE_URL` to the deployed backend URL

#### Option B: AWS (Production-grade)
- Frontend: `vite build` → S3 + CloudFront
- Backend: Express wrapped with `serverless-http` → Lambda + API Gateway (ap-south-1)
- `AGENTROUTER_API_KEY` in Secrets Manager or Lambda env var

### Deliverables

#### [NEW] `docs/PRD.md`
- Problem statement, solution overview, feature matrix
- Architecture diagram (Mermaid) — production vs prototype
- Metrics framework (cart acceptance rate, time-to-cart, budget compliance)
- Roadmap: prototype → production path

#### [NEW] `docs/ARCHITECTURE.md`
- System diagram: Frontend → Backend → AgentRouter proxy → LLM
- Data flow for each feature (F1-F12)
- Technology choices and trade-offs

#### Demo Video Script (3 beats)
1. **Photo → Cart (F2)**: Upload fridge photo → instant restock cart
2. **Budget Rebalance (F3)**: Over-budget query → live swap with savings banner
3. **Emergency Mode (F12)**: One-tap "I'm sick" → medicine cart in seconds

**Acceptance:**
- [ ] Live URL loads the app and processes queries
- [ ] PRD.md and Architecture diagram exist
- [ ] All three demo beats work on the live URL

---

## Updated Build Order

```
DONE: 0 setup → 1 data → 2 client → 3 search → 4 agent → 5 frontend hero
NEXT: 6 performance → 7 emergency+proactive UI → 8 multimodal →
      9 learn+polish → 10 deploy+demo
```

## Risk Guards (Updated)

- **LLM timeout**: If the proxy is slow, the frontend shows elapsed time + a "Taking longer than usual" message after 20s. Never let the user stare at a blank spinner.
- **Embedding API down**: Permanently mitigated — we use local 128-dim vectors exclusively. Zero network dependency for search.
- **JSON parse failures**: `safeJSON` + Zod validation + one retry. Already battle-tested.
- **Port conflicts**: Proxy and Express both catch `EADDRINUSE` gracefully instead of crashing.
- **Demo reliability**: Cache the 3 demo-beat queries so they work even if the LLM proxy goes down during the presentation. Pre-compute and store the responses as fallback JSON.

## Key Differences from Original Plan

| Original | Optimized | Why |
|----------|-----------|-----|
| 14 phases | 10 phases | Backend routes already built; consolidated |
| Embedding API calls for search | Local-only embeddings | Proxy has no embedding model; local is instant |
| `deepseek-v4-pro` | `deepseek-v4-flash` | 5-10x faster generation |
| Two LLM calls always | Single call for simple queries | Halves latency for common cases |
| Phase 6-7 separate (cart enhancers + budget) | Merged into Phase 5 (already done) | `enforceBudget` + `enforceAvailability` already in `nowAgent.ts` |
| Phase 10-11 (emergency + proactive) | Phase 7 (frontend only) | Backend routes already exist |
| AWS-only deploy | Vercel recommended (AWS as option) | Faster to deploy; same result |
