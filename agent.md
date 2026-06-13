# agent.md — Amazon Now

> Context file for the AI coding agent (Kiro / Claude). Read fully before generating code, specs, or tasks. Single source of truth. Keep it concise and current.

---

## 1. Identity
- **Project:** Amazon Now — *Delivery is fast. Now shopping is too.*
- **Hackathon:** HackOn with Amazon, Season 6.0 — 48hr. Theme: **Amazon Now (PS2, Reimagining Urgent Shopping)**.
- **Repo:** `amazon-now` · **Region:** `ap-south-1` · **Deliverables:** PRD + demo video + working prototype.
- **LLM:** **AgentRouter API** (OpenAI-compatible gateway, `https://agentrouter.org/v1`). **Deployed on AWS.**

---

## 2. Problem (condensed)
Quick-commerce customers arrive with an **immediate need** and want to finish in **seconds**, but today's apps still force *search → compare → build cart → decide*. The friction lives between **need** and **done**. Delivery is solved; shopping is not.

Three opportunity areas — every feature must map to at least one:
| Area | Customer voice | Levers |
|---|---|---|
| **Frictionless** | "I know what I want — reduce effort" | smart cart, instant reorder, simple journeys |
| **Shopping by Intent** | "I know my outcome — not the products" | conversational + goal-based shopping |
| **Predictive & Confident** | "I don't know it's time yet / unsure which" | need prediction, emergency mode, guided decisions |

Scoring: **Presentation · Implementation · Technical Architecture · Futuristic Vision.** Mantra: *start with the customer, work backwards, from need to done.*

---

## 3. Solution
Amazon Now is an **AI shopping agent** that converts a stated need — typed, spoken, or **photographed** — into a **ready-to-buy, budget-checked cart in seconds**, and explains every choice. We build the **intelligence layer only**; storefront, payments, and logistics are mocked. Pitch it as a feature *inside* the Amazon app (native dark + orange styling), not a competing store.

---

## 4. Features
| # | Feature | What it does | Opp. area | Tier |
|---|---|---|---|---|
| F1 | **Intent-to-Cart** (hero) | Stated need → one ready cart with a reason per item, one tap to buy | Intent · Frictionless | 1 |
| F2 | **Multimodal intent** | Photo of empty fridge / handwritten list / product box / recipe → cart | Intent · Innovation | 1 |
| F3 | **Budget rebalancing** | If cart exceeds budget, agent auto-swaps to cheaper equivalents, shows "saved ₹X", user can revert | Frictionless · Impl. | 1 |
| F4 | **Recipe / occasion-to-cart** | "Paneer butter masala for 4" / "Diwali for 10" → ingredients scaled to servings, minus likely-owned staples | Intent · Customer obsession | 1 |
| F5 | **Context-aware proactivity** | Pre-builds carts from weather (heatwave→cold drinks/ORS; rain→khichdi), festival calendar (Holi, Navratri vrat, Jain), and calendar events | Predictive · Vision | 2 |
| F6 | **Consumption-rate prediction** | Models usage rate ("2-day milk cycle → out Thursday"), not just past purchases | Predictive | 2 |
| F7 | **Substitution resilience** | Out-of-stock item auto-swapped to closest match with a note; cart never breaks | Technical feasibility | 3 |
| F8 | **One-pick decision** | Picks THE single best item with a confidence score + "why this", with a "show alternatives" escape hatch | Confident · Guided | 3 |
| F9 | **Learns from edits** | When user removes/swaps an item, records the preference for next time; agent visibly improves | Innovation | 3 |
| F10 | **Health/diet-aware swaps** | Respects diabetic/vegan/allergy/Jain profile, flags items, suggests healthier swaps (OTC only + "see a doctor"; never diagnoses) | Customer obsession | 3 |
| F11 | **Unit-economics nudges** | "Buy the 1kg, cheaper per gram, you'll finish it" / "you waste half the coriander — smaller pack" | Customer obsession | 3 |
| F12 | **Emergency mode** | One tap → pre-decided essentials bundle for an urgent moment, minimum taps | Predictive · Frictionless | 2 |

**Build priority:** Tier 1 (F1–F4) must demo flawlessly. Tier 2 (F5 one signal live, F6, F12) next. Tier 3 (F7–F11) are enhancers woven *into* F1's cart output, not separate screens. **Never sacrifice Tier 1 polish for Tier 3 breadth.**

---

## 5. The Now Agent (core)
Tool-using reasoning agent, not a single prompt.

**Loop:**
```
need (text / image / voice)
 → parse_intent            (image via vision model)
 → get_user_context        (household, diet, budget, history, learned prefs)
 → [decompose_recipe / decompose_occasion]   (sub-needs + serving scale)
 → search_catalog          (semantic + filter, per sub-need)
 → select & assemble       (prefer reorders, apply diet, one-pick per slot)
 → check_availability + substitute  (resilience)
 → check_budget + rebalance (swap cheaper if over)
 → CartProposal            (items + reason + confidence + nudges + swaps)
```

**Tools:**
| Tool | Purpose |
|---|---|
| `parse_intent` | text/image/voice → structured `{goal, constraints, contextHints}` |
| `get_user_context` | household, diet, budget, recent orders, learned prefs |
| `decompose_recipe` | recipe/occasion → ingredient sub-needs, scaled to servings |
| `search_catalog` | semantic + filtered candidate products |
| `get_reorder_candidates` | consumption-rate prediction of run-outs |
| `get_context_signals` | weather + festival + calendar signals (F5) |
| `check_availability` | stock check; returns substitute if out |
| `check_budget` | validate total vs limit; returns rebalance swaps if over |
| `record_feedback` | persist user edits as preferences (F9) |
| `build_cart` | finalise `CartProposal` |

**System prompt (starting point — iterate):**
```
You are the Now Agent for Amazon Now, an Indian quick-commerce assistant. Turn a
customer's NEED (text, image, or voice) into ONE ready-to-buy cart in seconds,
with the fewest decisions for them.
Rules:
- Start from the need, infer the products yourself. Be decisive: propose ONE cart.
- Respect household size, dietary profile, and budget from get_user_context; never
  exceed a stated/implied budget — rebalance to cheaper equivalents instead.
- Prefer items the user reordered before when they fit.
- For each item give: a one-line plain reason, a confidence, and any unit-economics nudge.
- If an item is unavailable, substitute the closest match and say so.
- Understand mixed English/Hinglish. Handle images (fridge, list, box, recipe).
- Ask AT MOST one clarifying question only if it materially changes the cart;
  otherwise proceed with a sensible default and note the assumption.
- Output strictly as CartProposal JSON. No prose outside it.
```

**Output — `CartProposal`:**
```ts
type CartItem = {
  productId: string; name: string; qty: number; price: number;
  reason: string;            // why it's here (trust layer)
  confidence: number;        // 0-1 (one-pick)
  substituteFor?: string;    // if F7 swapped an out-of-stock item
  nudge?: string;            // F11 unit-economics tip
  dietaryFlag?: string;      // F10 e.g. "high sugar"
};
type Swap = { from: string; to: string; saved: number; reason: string }; // F3
type CartProposal = {
  intentSummary: string;
  assumptions: string[];
  items: CartItem[];
  total: number; budget: number | null; withinBudget: boolean;
  rebalance?: Swap[];        // shown when budget exceeded then fixed
  clarifyingQuestion: string | null;
};
```

**Multimodal note:** AgentRouter is OpenAI-compatible — send images as base64 in a `image_url` content block to a **vision-capable model**. Same client, no extra SDK.

---

## 6. Architecture
**LLM:** all reasoning, vision, and embeddings via **AgentRouter** (OpenAI-compatible, `https://agentrouter.org/v1`, Bearer key). Endpoints used: `/v1/chat/completions` (reasoning + vision), `/v1/embeddings` (catalog/query vectors). **Everything else runs on AWS, and the app deploys to AWS.**

| Layer | Service | Role |
|---|---|---|
| LLM / vision / embeddings | **AgentRouter API** | intent, image understanding, cart reasoning, embeddings |
| Compute | **Lambda + API Gateway** | agent orchestration / backend |
| Data | **DynamoDB** | catalog, users, orders, preferences |
| Vector search | **OpenSearch Serverless** (vector) | semantic retrieval at scale |
| Frontend hosting | **S3 + CloudFront** | static SPA |
| Auth | **Cognito** | identity (production) |
| Secrets | **Secrets Manager / SSM** | AgentRouter key in production |

**Prototype simplifications (run live, state as deliberate):**
- Vector search: in-memory cosine similarity over precomputed embeddings.
- Auth: single seeded demo user (Cognito in diagram only).
- F5 signals: static Indian festival calendar + a public weather API; calendar mocked.
- Backend: single Node/TS service, structured so each route ports to a Lambda unchanged.

**Data flow (prototype):**
```
React SPA → Backend (Node/TS, Lambda-ready)
              ├─ AgentRouter  → reasoning / vision / embeddings
              ├─ Vector index → candidate products
              └─ DynamoDB/seed → catalog, user, orders, prefs
```

---

## 7. Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind. **Mobile-first.** Amazon UI (`#131A22` navy, `#FF9900` orange).
- **Backend:** Node.js + TypeScript (Express for prototype, Lambda-ready).
- **AI:** AgentRouter via the OpenAI SDK with `baseURL` override. Vision-capable chat model + an embedding model — confirm exact model IDs in the AgentRouter console at build time.
- **Data:** DynamoDB / seed JSON + vector index.
- **Infra:** AWS `ap-south-1`. Built with Kiro (use spec mode to generate PRD + tasks).

---

## 8. Repository Structure
```
amazon-now/
├── agent.md  README.md  PRD.md
├── frontend/src/{components,pages,lib,styles}
├── backend/src/
│   ├── agent/        # nowAgent.ts (loop), prompts.ts, tools/
│   ├── services/     # agentrouter.ts, embeddings.ts, vectorSearch.ts, catalog.ts, signals.ts
│   ├── routes/       # intent, emergency, reorder, proactive, checkout, feedback
│   ├── data/         # seed-catalog.json, seed-user.json, seed-orders.json
│   └── types/        # CartProposal, Product, User, Order
├── scripts/generate-catalog.ts   # LLM-generate + embed catalog
└── docs/architecture
```

---

## 9. Data Models
```ts
type Product = {
  id: string; name: string; category: string; subcategory: string; brand?: string;
  price: number; unit: string; packSize?: string; tags: string[]; dietary: string[];
  inStock: boolean; popularity: number; imageUrl: string; embedding?: number[];
};
type User = {
  id: string; name: string;
  household: { size: number; dietary: string[]; budgetSensitivity: "low"|"med"|"high" };
  defaultBudget?: number;
  learnedPrefs?: { avoid: string[]; prefer: string[] };   // F9
};
type Order = { id: string; userId: string; items: {productId:string; qty:number}[]; createdAt: string };
```

---

## 10. API Contract
| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/intent` | `{userId, text?, imageBase64?}` | `CartProposal` |
| POST | `/api/emergency` | `{userId, scenario}` | `CartProposal` |
| GET | `/api/reorder/:userId` | — | `{candidates: CartItem[]}` |
| GET | `/api/proactive/:userId` | — | `{suggestions: CartProposal[]}` |
| POST | `/api/feedback` | `{userId, removed?, added?}` | `{ok: true}` |
| POST | `/api/checkout` | `{userId, items}` | `{orderId, status:"confirmed"}` (mock) |

---

## 11. Conventions
- TypeScript everywhere; shared types in `backend/src/types`, imported by the frontend client.
- Strictly validate the LLM's `CartProposal` JSON; on parse failure, retry once with a repair prompt.
- No secrets in code. AgentRouter key via env (`.env`, git-ignored) locally; Secrets Manager in AWS.
- Routes thin; logic in `services/` + `agent/` so they port to Lambda unchanged.
- Mobile-first; primary surface = one intent bar (with camera/mic) + a `CartProposalCard`.
- Every item must render its `reason` — explainability is a requirement, not optional.
- Prefer real AgentRouter calls; only stub if access is blocked, and flag stubbed output.

**Env (`backend/.env`):**
```
AGENTROUTER_BASE_URL=https://agentrouter.org/v1
AGENTROUTER_API_KEY=<key>
AGENTROUTER_MODEL=<vision-capable chat model id>
AGENTROUTER_EMBED_MODEL=<embedding model id>
AWS_REGION=ap-south-1
```

---

## 12. 48-Hour Build Plan
1. **h0–6:** scaffold repo, generate + embed seed catalog, intent bar UI shell, AgentRouter client wired.
2. **h6–20:** F1 end-to-end (intent → search → assemble → reasons → `CartProposalCard`). One query flawless, then generalise. Fold in F7/F8/F11 (they're cart fields).
3. **h20–28:** F2 multimodal (photo → cart) and F3 budget rebalancing live. These are your hero video beats.
4. **h28–34:** F4 recipe/occasion; F12 emergency; F9 learn-from-edits.
5. **h34–40:** F5 (one signal live: weather or festival) + F6 reorder; mobile polish, streaming cart assembly.
6. **h40–46:** PRD, architecture diagram, record demo video (F2 first beat, then F3, then F4). Screening is AI-first on PRD + video — do not leave to the last hour.
7. **h46–48:** rehearse pitch; fix only demo-path bugs; deploy to AWS.

---

## 13. Out of Scope (mocked, state deliberately)
Real payments · real Amazon catalog/PA-API/scraping · real logistics · multi-user auth · live OpenSearch/Cognito provisioning. Seeded mini-catalog + mock checkout + heuristics stand in.
