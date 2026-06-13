# Amazon Now — Implementation Plan

> Build plan for an agentic IDE (Antigravity). Pair this with `agent.md` (the spec) and `README.md`. Execute **phase by phase, in order**, and verify each phase's **Acceptance criteria** before moving on. Do not skip ahead — later phases depend on earlier ones. Defaults are decided in `agent.md`; do not re-decide stack or architecture.

## How to drive this with Antigravity
1. Load `agent.md`, `README.md`, and this file into the workspace as context.
2. Tell the agent: *"Implement Phase N. Follow the steps and files exactly. When done, run the acceptance check and report pass/fail before continuing."*
3. Keep the vertical-slice rule: **F1 (Intent-to-Cart) must work end-to-end before any other feature.** Breadth comes after the hero is solid.

## Guiding architecture decision (read first)
We use an **orchestrated pipeline**, not a free-running tool-calling agent. The backend controls the steps deterministically and calls the LLM only for (a) parsing intent and (b) assembling + explaining the cart, each returning **strict JSON**. This is far more reliable for a live demo than letting the model loop over tools. (The full tool-calling agent is the documented production path; the pipeline is the prototype.)

All LLM/vision/embedding calls go to **AgentRouter** (OpenAI-compatible, `https://agentrouter.org/v1`).

---

## Phase 0 — Project setup
**Goal:** empty but runnable monorepo.

Steps:
1. Create the structure from `agent.md` §8: `frontend/`, `backend/`, `scripts/`, `docs/`.
2. `backend`: init Node + TypeScript + Express. Add deps: `openai`, `express`, `cors`, `dotenv`, `zod` (schema validation), `@aws-sdk/client-dynamodb` (later). Dev: `tsx`, `typescript`, `@types/*`.
3. `frontend`: `npm create vite@latest` (React + TS), add Tailwind, `lucide-react` for icons.
4. Add `.gitignore` (node_modules, `.env`, dist).
5. Create `backend/.env` with the keys from `agent.md` §11.

**Acceptance:** `npm run dev` starts an empty Express server on a port and a blank Vite app; both compile with no TS errors.

---

## Phase 1 — Data foundation (seed catalog + embeddings)
**Goal:** a realistic mini-catalog with vectors, ready for search. Nothing else works without this.

Steps:
1. `scripts/generate-catalog.ts`: use AgentRouter chat to generate **200–300 products** across categories: grocery, daily essentials, OTC, snacks, beverages, baby, home. Each product matches the `Product` type (`agent.md` §9), including `price` (INR), `unit`, `packSize`, `tags`, `dietary`, `inStock` (set ~10% to `false` to demo substitution), `popularity`, `imageUrl` (use a placeholder service or category emoji-free static images).
2. Embed every product (`name + tags + subcategory`) via AgentRouter `/v1/embeddings`. Store the vector on each product.
3. Write the result to `backend/src/data/seed-catalog.json`.
4. Create `seed-user.json` (one demo user with household size, dietary prefs, `defaultBudget`, empty `learnedPrefs`) and `seed-orders.json` (~15 past orders across a few weeks so consumption-rate and reorder have signal).

**Acceptance:** `seed-catalog.json` exists with 200+ products, each with a non-empty `embedding` array of consistent length; some `inStock:false`.

---

## Phase 2 — AgentRouter client + backend skeleton
**Goal:** one tested wrapper for all model calls.

Steps:
1. `backend/src/services/agentrouter.ts` — use the OpenAI SDK with the base URL overridden:
```ts
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY,
  baseURL: process.env.AGENTROUTER_BASE_URL, // https://agentrouter.org/v1
});

// Strict-JSON chat call (used for parse + assemble)
export async function chatJSON(system: string, user: any) {
  const res = await client.chat.completions.create({
    model: process.env.AGENTROUTER_MODEL!,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    temperature: 0.2,
    response_format: { type: "json_object" }, // if supported by chosen model; else instruct JSON-only
  });
  return JSON.parse(res.choices[0].message.content!);
}

// Vision: pass user content as an array with image_url (base64 data URL)
export async function chatVisionJSON(system: string, text: string, imageBase64: string) {
  return chatJSON(system, [
    { type: "text", text },
    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
  ]);
}

export async function embed(text: string): Promise<number[]> {
  const res = await client.embeddings.create({ model: process.env.AGENTROUTER_EMBED_MODEL!, input: text });
  return res.data[0].embedding;
}
```
2. Add a `safeJSON` helper: parse; if it throws, re-call once with a "return valid JSON only" repair instruction.
3. `backend/src/services/catalog.ts`: load `seed-catalog.json` into memory; expose `getById`, `all`.

**Acceptance:** a throwaway script calls `chatJSON` and `embed` and prints valid output from AgentRouter.

---

## Phase 3 — Vector search
**Goal:** semantic retrieval over the catalog.

Steps:
1. `backend/src/services/vectorSearch.ts`: implement in-memory cosine similarity. Function `search(query, {category?, maxPrice?, dietary?, inStockOnly?}, topK=8)`:
   - `embed(query)` → query vector.
   - cosine vs every product's embedding; apply filters; return topK products + score.
2. Keep it pure and synchronous after embedding.

**Acceptance:** `search("breakfast bread eggs")` returns sensible breakfast items ranked first.

---

## Phase 4 — The Now Agent core + `/api/intent` (F1 HERO)
**Goal:** stated need → `CartProposal`, end-to-end. This is the whole project's spine.

Steps:
1. `backend/src/types/`: define `Product`, `User`, `Order`, `CartItem`, `Swap`, `CartProposal` (from `agent.md` §5, §9). Mirror them as `zod` schemas for validation.
2. `backend/src/services/userContext.ts`: `getUserContext(userId)` → user + recent orders + `learnedPrefs`.
3. `backend/src/agent/prompts.ts`: the system prompt from `agent.md` §5, plus a separate parse-intent prompt.
4. `backend/src/agent/nowAgent.ts` — the orchestrated pipeline:
```
buildCart(userId, { text, imageBase64 }):
  ctx = getUserContext(userId)
  intent = parseIntent(text|image, ctx)        // LLM → { summary, subNeeds[], constraints{budget,dietary}, hints }
  candidatesBySubNeed = for each subNeed: vectorSearch(subNeed.query, filters from constraints)
  proposal = assembleCart(intent, candidatesBySubNeed, ctx)  // LLM → CartProposal JSON
  proposal = enforceBudget(proposal, candidatesBySubNeed)    // Phase 7 hook (no-op for now)
  validate(proposal)  // zod; repair-retry once on failure
  return proposal
```
   - `parseIntent`: LLM returns sub-needs (e.g. "breakfast for 2" → ["bread","eggs","milk","spread"]) plus budget/dietary pulled from text or `ctx`.
   - `assembleCart`: LLM is given the candidate products per sub-need and picks ONE per slot, writes `reason`, `confidence`, applies dietary, and (Phase 5) `nudge`/`dietaryFlag`. Must output strict `CartProposal` JSON.
5. `backend/src/routes/intent.ts`: `POST /api/intent` → `buildCart`. Wire into Express.

**Acceptance:** `curl POST /api/intent {userId, text:"breakfast for 2 under 300"}` returns a valid `CartProposal` with 3–5 items, each with a reason, total ≤ budget.

---

## Phase 5 — Frontend hero flow
**Goal:** the demo screen.

Steps:
1. `frontend/src/lib/api.ts` (typed client) and `types.ts` (import shared shapes).
2. Components (mobile-first, Amazon dark `#131A22` + orange `#FF9900`):
   - `IntentBar` — text input + camera button + mic button + send. Camera/mic disabled-stub for now.
   - `CartProposalCard` — renders `intentSummary`, total vs budget bar, `assumptions`, and a list of `ItemRow`.
   - `ItemRow` — name, qty, price, `reason`, a small confidence pip, optional `nudge` / `dietaryFlag` chips, optional "substituted" tag.
   - `OrderConfirm` — mock confirmation after checkout.
3. `pages/Home.tsx`: IntentBar at top, CartProposalCard below; loading/streaming state while waiting.
4. Wire IntentBar → `POST /api/intent` → render the card. Add a "Buy now" button → `POST /api/checkout` (stub) → OrderConfirm.

**Acceptance:** typing a need in the browser produces a rendered cart with reasons; "Buy now" shows confirmation. This is the minimum viable demo.

---

## Phase 6 — Fold in Tier-3 cart enhancers
**Goal:** richer cart output without new screens. These are fields, not pages.

Steps (extend `assembleCart` prompt + `ItemRow`):
1. **One-pick decision (F8):** the LLM already picks one per slot — surface its `confidence` and, when low, attach the top alternative; add a "show alternatives" expander in `ItemRow`.
2. **Substitution resilience (F7):** in `assembleCart`, if a chosen item is `inStock:false`, swap to the nearest in-stock candidate in the same subcategory and set `substituteFor`. Render a "substituted" tag.
3. **Unit-economics nudges (F11):** instruct the LLM to add a `nudge` when a larger pack is cheaper per unit, using `packSize`/`unit`.
4. **Health/diet flags (F10):** set `dietaryFlag` for items conflicting with profile; suggest a healthier swap in `reason`. Keep medical wording light.

**Acceptance:** a query that hits an out-of-stock item returns a working substitute with a tag; at least one item shows a nudge; confidence renders per item.

---

## Phase 7 — Budget rebalancing with live swaps (F3)
**Goal:** the strongest "it reasons" demo beat.

Steps:
1. Implement `enforceBudget(proposal, candidates)` deterministically: if `total > budget`, repeatedly replace the most expensive item with the cheapest acceptable same-subcategory candidate until within budget; record each as a `Swap {from,to,saved,reason}` in `proposal.rebalance`.
2. Frontend: when `rebalance` is present, show a banner ("Was over by ₹X — rebalanced, saved ₹Y") and per-swap **Accept / Revert** controls. Revert recomputes the total client-side.

**Acceptance:** an over-budget query returns a within-budget cart plus a visible `rebalance` list; revert restores the original item and total.

---

## Phase 8 — Recipe / occasion-to-cart (F4) - [x] DONE
**Goal:** one need → many sub-needs, scaled to servings.

Steps:
1. Add `decompose_recipe` step in `parseIntent`: if the text is a dish/occasion ("paneer butter masala for 4", "Diwali for 10"), the LLM returns ingredient sub-needs with quantities scaled to servings, and excludes likely-owned staples (salt, water) unless the user lacks them.
2. Feed those sub-needs into the existing search + assemble path.

**Acceptance:** "paneer butter masala for 4" returns paneer, tomato, butter, cream, spices in sensible quantities, not generic groceries.

---

## Phase 9 — Multimodal intent (F2)
**Goal:** the headline video moment.

Steps:
1. Frontend `IntentBar` camera button: capture/upload an image, convert to base64, send to `POST /api/intent` as `imageBase64`.
2. Backend `parseIntent`: when `imageBase64` is present, call `chatVisionJSON` with a prompt: *"This is a photo of a fridge / list / product / recipe. Extract what the customer needs as sub-needs."* Then continue the normal pipeline.
3. Mic button (optional): browser SpeechRecognition → text → existing path. Skip if time-short.

**Acceptance:** uploading an empty-fridge photo produces a restock cart; a handwritten list photo produces the listed items.

---

## Phase 10 — Emergency mode (F12) + learn-from-edits (F9)
Steps:
1. `POST /api/emergency {userId, scenario}` — map scenarios ("sick", "guests", "out of staples") to a synthesized intent, reuse `buildCart`. Frontend: a row of one-tap scenario chips.
2. `POST /api/feedback {userId, removed?, added?}` — update `learnedPrefs.avoid/prefer`. Frontend: when a user removes an item, fire feedback. Include `learnedPrefs` in `getUserContext` so future carts reflect it.

**Acceptance:** an emergency chip returns a bundle in one tap; removing an item twice then re-running a related query shows that item de-prioritised.

---

## Phase 11 — Proactivity (F5, one signal) + consumption-rate reorder (F6)
Steps:
1. `backend/src/services/signals.ts`: `getContextSignals()` → today's date → festival from a static Indian festival map; weather from a public weather API for the user's city (whitelist the domain). Calendar mocked.
2. `GET /api/proactive/:userId`: pick the most relevant signal, synthesize an intent ("heatwave today → cooling essentials"), reuse `buildCart`, return as a suggestion. Frontend: a dismissible `ProactiveBanner` on Home.
3. `GET /api/reorder/:userId`: from `seed-orders`, compute average days between purchases per product; if `daysSinceLast >= avgInterval`, add to candidates with a confidence. Frontend: a "Running low?" strip.

**Acceptance:** the home screen shows one proactive suggestion and a reorder strip derived from order history.

---

## Phase 12 — Deploy to AWS
**Goal:** a live URL for the demo.

Steps:
1. **Frontend:** `vite build` → upload `dist/` to an **S3** bucket (static hosting) → front with **CloudFront**.
2. **Backend:** package the Express app as a single **Lambda** behind **API Gateway** (use AWS SAM or the Serverless Framework; `serverless-http` wraps Express). Region `ap-south-1`.
   - Easier fallback if Lambda packaging stalls: deploy the backend to **AWS App Runner** from the container/repo — same result, fewer moving parts. Note the choice in the pitch.
3. Put `AGENTROUTER_API_KEY` in **Secrets Manager** (or a Lambda env var for the prototype). Set frontend's API base URL to the deployed API.
4. Move `seed-catalog.json` into the Lambda bundle (in-memory) for the prototype; note DynamoDB + OpenSearch as the production path.

**Acceptance:** the CloudFront URL loads the app and a full intent query works against the deployed backend.

---

## Phase 13 — Demo + deliverables
Steps:
1. **PRD.md** — finalise (problem, solution, features, architecture, metrics, roadmap). Required deliverable.
2. **Architecture diagram** — the production design (AgentRouter + AWS), with the prototype simplifications labelled.
3. **Demo video** — order the beats for impact: **(1) photo → cart (F2)**, **(2) over-budget → live rebalance (F3)**, **(3) recipe-to-cart (F4)**, then a quick emergency/proactive flash. Show explanations on screen.
4. Rehearse the 1-line story: *"Delivery is fast. We made shopping fast too — say or show your need, get a confident cart in seconds."*

**Acceptance:** PRD + diagram + a clean 2–3 minute video exist; the three hero beats work on the live URL.

---

## Build order summary
```
0 setup → 1 data → 2 AgentRouter client → 3 vector search →
4 /api/intent (F1 hero) → 5 frontend hero → 6 Tier-3 cart fields →
7 budget rebalance (F3) → 8 recipe (F4) → 9 multimodal (F2) →
10 emergency + learn (F12,F9) → 11 proactive + reorder (F5,F6) →
12 deploy AWS → 13 demo + PRD
```

## Risk guards
- If AgentRouter access fails, gate behind a deterministic stub and flag stubbed output — never let the demo path die silently.
- Always validate `CartProposal` with zod and repair-retry once; a broken JSON parse must never reach the UI.
- Keep the demo path (F1, F2, F3) deployed and green before adding F5/F6 polish.
