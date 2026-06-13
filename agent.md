# agent.md — Amazon Now

> Context file for AI coding agents (Kiro / Claude). Read this fully before generating code, specs, or tasks. This is the single source of truth for what we are building, why, and how. Keep it updated as the project evolves.

---

## 1. Project Identity

- **Project name:** Amazon Now
- **Tagline:** *Delivery is fast. Now shopping is too.*
- **Hackathon:** HackOn with Amazon — Season 6.0, 48hr Hackathon Challenge
- **Theme:** Amazon Now — Reimagining Urgent Shopping (Problem Statement 2)
- **Internal codename / repo:** `amazon-now`
- **Region:** `ap-south-1` (Mumbai) — Indian quick-commerce context
- **Deliverables expected by the hackathon:** PRD + demo video. A working prototype (any fidelity) that proves the idea.

---

## 2. Problem Statement (analysed)

### 2.1 The raw problem
Quick-commerce customers are fundamentally different from traditional e-commerce customers. They arrive with an **immediate need** and expect to finish their purchase in **seconds**. But today's shopping still relies on **search, browse, compare, and manual decision-making**.

> Core challenge: *How might we help customers discover, decide, and purchase what they need in the fastest and most effortless way possible?*

### 2.2 Customer reality (the gap)
| Customer does today | Customer actually wants |
|---|---|
| Searches | Solve the need |
| Compares options | Minimal effort |
| Builds a cart manually | Done in seconds |
| Spends minutes deciding | — |

The friction is **between the need and the done**. Delivery (logistics) is already solved. The unsolved part is the *cognitive load of shopping*: turning a vague human need into the right set of products and a completed order.

### 2.3 The three opportunity areas (from the brief)
We design directly against these. Every feature must map to at least one.

1. **Frictionless Shopping** — *"I know what I want — reduce my effort."* → smart cart building, instant re-orders, simplified purchase journeys.
2. **Shopping by Intent** — *"I know my outcome — not the products."* → conversational shopping, goal-based shopping.
3. **Predictive & Confident** — *"I don't know it's time yet — or I'm unsure which."* → AI-powered need prediction, emergency mode, guided decision support.

### 2.4 What a great submission shows (judge lens)
- **Customer obsession** — a real pain, deeply understood.
- **Innovative thinking** — a fresh take, not the obvious.
- **Technical feasibility** — a realistic path from prototype to production.
- **Vision to scale** — how it evolves for millions.
- Mantra: *Start with the customer. Work backwards. From need to done.*

### 2.5 Scoring criteria (build to win these)
1. Quality of Presentation — clarity, storytelling, communicating complex ideas simply.
2. Quality of Implementation — working prototype, code quality, UX polish.
3. Technical Architecture — scalability, design decisions, system thinking.
4. Futuristic Vision — roadmap beyond hackathon, Think Big.

---

## 3. Our Solution

**Amazon Now is an AI shopping agent that converts a human *need*, stated in plain language, into a ready-to-buy cart in seconds — and explains why.**

We do NOT rebuild Amazon's storefront, payments, inventory, or logistics. We build the **intelligence layer that sits on top** and removes the search → compare → build → decide loop. The commerce shell is mocked just enough to make the experience believable; all real engineering goes into the agent.

### 3.1 Positioning for the pitch
Present it as *"how Amazon Now should feel"* — a feature inside the Amazon app, styled natively (Amazon dark + orange). Not a competing storefront. This gives native credibility without touching Amazon's live APIs (which we cannot legitimately use in 48h).

### 3.2 Feature set (in priority order)

#### F1 — Intent-to-Cart (HERO, must work end-to-end)
The user states a *need*, not a product. The agent interprets it, pulls personal context, searches the catalog semantically, assembles a ready-to-buy cart, validates it against budget/dietary constraints, and **explains each choice**. One tap to buy.
- Maps to: Shopping by Intent + Frictionless + (explainability →) Confident.
- Example inputs (support English + Hinglish — this is authentic to Indian quick-commerce):
  - "kal subah breakfast, 2 log, under ₹300"
  - "headache hai, medicine + kuch light khane ko"
  - "weekend party for 6 people, snacks and cold drinks"
  - "monthly grocery essentials, family of 4, budget ₹2000"

#### F2 — Emergency Mode (supporting, build fully if time allows)
One tap surfaces a pre-decided essentials bundle for an urgent context (sick, guests arriving, ran out of staples). Optimised for absolute minimum taps. Demonstrates "done in seconds."
- Maps to: Predictive & Confident + Frictionless.

#### F3 — Smart Reorder / Need Prediction (supporting; mock if time-constrained)
From purchase history, the agent predicts what the user is about to run out of and proposes a one-tap reorder before the user searches.
- Maps to: Predictive & Confident + Frictionless (instant re-orders).

> Build rule: **F1 fully, then F2 fully, then F3.** Never sacrifice F1 polish for F3 breadth.

### 3.3 The trust / explainability layer (cross-cutting)
Every agent-built cart shows a short rationale per item ("under budget", "you reordered this twice", "lighter on the stomach for a headache"). This directly answers the *"I'm unsure which"* anxiety and is a key differentiator for the *Confident* opportunity area. Never ship a cart the user can't understand.

---

## 4. The Now Agent (core intelligence)

This is the heart of the project. Treat it as a tool-using reasoning agent, not a single prompt.

### 4.1 Reasoning loop
```
user need (text/voice)
   │
   ▼
1. parse_intent        → structured intent {goal, constraints, context_hints}
2. get_user_context    → household profile, budget sensitivity, recent purchases
3. search_catalog      → semantic + filtered candidate products (per sub-need)
4. select & assemble   → choose items, quantities; respect dietary + budget
5. validate (budget, availability)
6. produce CartProposal + per-item rationale
   │
   ▼
one-tap checkout (mock)
```

### 4.2 Agent tools (functions exposed to the LLM)
| Tool | Purpose | Input | Output |
|---|---|---|---|
| `search_catalog` | semantic + filter search over products | `query`, `filters{category, maxPrice, dietary}`, `topK` | ranked products |
| `get_user_context` | household + budget + history | `userId` | user profile + recent orders |
| `get_reorder_candidates` | predict run-outs | `userId` | likely-needed items + confidence |
| `check_budget` | validate cart total vs limit | `cart`, `limit` | pass/fail + delta |
| `build_cart` | finalise proposal | `items[]` | `CartProposal` with totals |

### 4.3 System prompt (starting point — iterate during the hackathon)
```
You are the Now Agent, the AI shopping assistant for Amazon Now, an Indian
quick-commerce experience. Your job: turn a customer's stated NEED into a
ready-to-buy cart in seconds, with the fewest decisions for the user.

Rules:
- Start from the need, not the product. Infer the products yourself.
- Always respect the user's budget, dietary preferences, and household size
  from get_user_context. If a budget is implied or stated, never exceed it.
- Prefer items the user has reordered before when they fit the need.
- Be decisive. Propose ONE good cart, not a list of options to compare.
- For every item, give a one-line plain-language reason it is in the cart.
- Understand mixed English/Hinglish input naturally.
- If the need is ambiguous in a way that materially changes the cart, ask AT
  MOST one short clarifying question; otherwise proceed with a sensible default
  and note the assumption.
- Output strictly in the CartProposal JSON schema. No prose outside it.
```

### 4.4 Output contract — `CartProposal`
```json
{
  "intentSummary": "Breakfast for 2, under ₹300",
  "assumptions": ["No dietary restrictions on file; chose vegetarian by default"],
  "items": [
    {
      "productId": "p_103",
      "name": "Brown Bread 400g",
      "qty": 1,
      "price": 45,
      "reason": "Staple for breakfast; you reordered this last week"
    }
  ],
  "total": 278,
  "budget": 300,
  "withinBudget": true,
  "clarifyingQuestion": null
}
```

---

## 5. Architecture

### 5.1 Principle
Build the **production-grade architecture on paper (diagram + PRD)**, run a **slim version live**. The deliberate gap between the two is itself a strong "system thinking" signal for judges. State it explicitly in the pitch.

### 5.2 AWS services (production design)
| Layer | Service | Role |
|---|---|---|
| Reasoning | **Amazon Bedrock** (Claude model) | intent parsing, cart assembly, rationale |
| Embeddings | **Bedrock Titan Embeddings** | product + query vectors |
| Vector search | **OpenSearch Serverless** (vector) | semantic catalog retrieval at scale |
| Catalog / orders / users | **DynamoDB** | core data |
| Compute | **Lambda + API Gateway** | stateless backend / agent orchestration |
| Recommendations | **Amazon Personalize** (optional) | reorder & need-prediction signal |
| Auth | **Amazon Cognito** | user identity |
| Frontend hosting | **S3 + CloudFront** | static SPA |

### 5.3 Prototype simplifications (run live in 48h)
- Vector search: in-memory cosine similarity over precomputed embeddings (or a small local vector index) instead of OpenSearch Serverless. **Note this as a deliberate prototype choice.**
- Auth: single seeded demo user; Cognito only in the diagram.
- Personalize: replace with a simple heuristic over `orders` (frequency + recency) for the demo.
- Backend can run as a single Node/TypeScript service locally, structured so each route maps cleanly to a Lambda later.

### 5.4 Data flow (live prototype)
```
React SPA  ──HTTP──▶  Backend (Node/TS)
                          │
                          ├─ Bedrock (Claude)  → agent reasoning
                          ├─ Bedrock (Titan)   → query embedding
                          ├─ Vector index      → candidate products
                          └─ DynamoDB / seed    → catalog, user, orders
```

---

## 6. Tech Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS. **Mobile-first** (quick commerce is a phone experience). Amazon visual language (dark navy `#131A22`, Amazon orange `#FF9900`).
- **Backend:** Node.js + TypeScript (Express for prototype, Lambda-ready structure).
- **AI:** AWS Bedrock (Claude for reasoning, Titan for embeddings). Tool/function calling via the Bedrock Converse API.
- **Data:** DynamoDB (or local JSON seed for prototype); vector index for semantic search.
- **Infra:** AWS (ap-south-1). Built with **Kiro** (use spec mode to generate the PRD + task breakdown).

> Verify the exact Claude and Titan model IDs available in your Bedrock console for ap-south-1 at build time — model IDs change. Use the latest available Claude model.

---

## 7. Repository Structure
```
amazon-now/
├── agent.md                 # this file
├── README.md
├── PRD.md                   # product requirements (hackathon deliverable)
├── frontend/
│   ├── src/
│   │   ├── components/       # ChatComposer, CartProposalCard, ItemRow, EmergencyMode, ...
│   │   ├── pages/            # Home (intent bar), CartReview, OrderConfirm
│   │   ├── lib/              # api client, types
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── agent/            # nowAgent.ts (loop), prompts.ts, tools/
│   │   ├── services/         # bedrock.ts, embeddings.ts, vectorSearch.ts, catalog.ts
│   │   ├── routes/           # /intent, /reorder, /emergency, /checkout
│   │   ├── data/             # seed-catalog.json, seed-user.json, seed-orders.json
│   │   └── types/            # shared schemas (CartProposal, Product, User)
│   └── package.json
├── scripts/
│   └── generate-catalog.ts   # LLM-generate + embed the seed catalog
└── docs/
    └── architecture.md / diagram
```

---

## 8. Data Models

```ts
type Product = {
  id: string;
  name: string;
  category: string;          // grocery, essentials, otc, snacks, beverages, baby, home
  subcategory: string;
  brand?: string;
  price: number;             // INR
  unit: string;              // "400g", "1L", "pack of 6"
  tags: string[];            // "breakfast", "light", "party", ...
  dietary: string[];         // "veg", "non-veg", "vegan", "gluten-free"
  popularity: number;        // 0-1, for tie-breaks
  imageUrl: string;
  embedding?: number[];      // precomputed
};

type User = {
  id: string;
  name: string;
  household: { size: number; dietary: string[]; budgetSensitivity: "low" | "med" | "high" };
  defaultBudget?: number;
};

type Order = { id: string; userId: string; items: { productId: string; qty: number }[]; createdAt: string };

type CartItem = { productId: string; name: string; qty: number; price: number; reason: string };
type CartProposal = {
  intentSummary: string;
  assumptions: string[];
  items: CartItem[];
  total: number;
  budget: number | null;
  withinBudget: boolean;
  clarifyingQuestion: string | null;
};
```

---

## 9. API Contract (prototype)
| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/intent` | `{ userId, text }` | `CartProposal` |
| POST | `/api/emergency` | `{ userId, scenario }` | `CartProposal` |
| GET | `/api/reorder/:userId` | — | `{ candidates: CartItem[] }` |
| POST | `/api/checkout` | `{ userId, items }` | `{ orderId, status: "confirmed" }` (mock) |

---

## 10. Conventions for the building agent (Kiro/Claude)
- TypeScript everywhere; shared types live in `backend/src/types` and are imported by the frontend client.
- Keep the agent's LLM output strictly schema-validated (parse + validate `CartProposal`; on failure, retry once with a repair prompt).
- No secrets in code. AWS creds via environment / AWS profile only. `.env` is git-ignored.
- Backend routes must be thin; logic lives in `services/` and `agent/` so they port to Lambda unchanged.
- Mobile-first CSS; the primary surface is a single intent bar + a cart proposal card.
- Every product card and cart item must render its `reason` — explainability is a product requirement, not optional.
- Prefer real Bedrock calls; only fall back to a deterministic stub if Bedrock access is blocked, and clearly flag stubbed responses.

---

## 11. 48-Hour Build Plan (milestones)
1. **Foundation (h0–6):** scaffold repo, seed catalog via `generate-catalog.ts`, compute embeddings, stand up backend + intent bar UI shell.
2. **Hero loop (h6–20):** `POST /api/intent` working end-to-end — Bedrock intent parse → vector search → cart assembly → rationale → render `CartProposalCard`. Get ONE query flawless, then generalise.
3. **Polish hero (h20–30):** Amazon-styled mobile UX, loading/streaming states, edit-cart, mock checkout confirmation.
4. **Supporting flows (h30–38):** Emergency Mode fully; Smart Reorder (heuristic).
5. **Deliverables (h38–46):** PRD finalised, architecture diagram, record demo video (show F1 hero first, then F2). Remember screening is AI-first on **PRD + demo video** — do not leave these to the last hour.
6. **Buffer (h46–48):** rehearse the pitch narrative; fix only demo-path bugs.

---

## 12. Out of Scope (explicitly mocked)
- Real payments / payment gateway (mock confirmation screen).
- Real Amazon catalog / PA-API / scraping (seeded mini-catalog instead).
- Real logistics / delivery.
- Multi-user auth (single seeded demo user).
- Real OpenSearch / Personalize provisioning (architecture only; heuristics live).

State these clearly in the demo as deliberate scope decisions, paired with the production architecture.

---

## 13. Glossary
- **Intent-to-Cart:** turning a stated need into a finished cart, no search/browse.
- **Now Agent:** the Bedrock-powered tool-using agent at the core.
- **CartProposal:** the agent's structured output — items + reasons + budget check.
- **Trust layer:** per-item rationale shown to the user for confidence.
