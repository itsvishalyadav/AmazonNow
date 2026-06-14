<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" width="200"/>
  <h1>Amazon Now</h1>
  <p><strong>Delivery is fast. Now shopping is too.</strong></p>
  <p><i>An AI-powered conversational commerce layer built for HackOn with Amazon — Season 6.0</i></p>
</div>

---

## 🚀 The Problem

Quick-commerce delivery is a solved problem—orders arrive in 10 minutes. **Shopping itself is not.** 
Customers arrive with an immediate, high-stress need but still have to endure friction: *search, compare, build a cart, and spend minutes deciding.* 

The friction lives **between the need and the checkout.**

| What customers do today | What they actually want |
|---|---|
| Search → Compare → Build Cart → Decide | State the Need → Auto-Cart → Swipe to Order |

## 💡 Our Answer

**Amazon Now** completely reimagines urgent shopping. You tell Amazon Now your *outcome* (via text, voice, or photo), not the products. The **Now Agent** figures out the rest—and shows you *why* it chose what it did. 

> "kal subah breakfast, 2 log, under ₹300" — or a photo of your empty fridge — becomes a complete, budget-checked cart. One swipe to buy.

---

## ✨ Key Features

### 1. Intent-to-Cart (Frictionless Shopping)
- **Multimodal Intent**: Snap a photo of an empty fridge, a handwritten list, a product box, or a recipe; the agent reads it and builds the cart.
- **Recipe / Occasion-to-Cart**: "Paneer butter masala for 4" → ingredients scaled to servings, minus the staples you likely already own.
- **Budget Rebalancing**: Over budget? The agent re-optimizes in real-time, swaps to cheaper equivalents ("saved ₹40, same quantity"), and lets you revert.

### 2. Proactive & Predictive Context
- **Google Calendar Integration**: The backend securely syncs with your Google Calendar via cookies to proactively suggest carts for upcoming events (e.g., Birthday parties, Meetings).
- **Consumption-Rate Prediction**: Models how fast you use things ("2-day milk cycle → out Thursday").
- **Weather & Festival Awareness**: Dynamically suggests carts based on local weather (e.g., heatwaves) and Indian festivals.

### 3. High-Stress Emergency Mode
- **Extreme Scenarios**: One-tap SOS chips for intense emergencies like **Cut Finger** (curates first-aid, dettol, band-aids), **Burned Cooking**, or **Severe Cramps**.
- **Done in Seconds**: Bypasses the entire shopping funnel to provide exactly what is needed instantly.

### 4. Unmatched UX & Trust Layer
- **Explicit Trust Badges**: Items feature dynamic badges (🏆 Top Match, 💰 Best Value, 🌿 Vegan) driven by AI confidence scores.
- **Swipe-to-Order**: Replaces the boring "Buy Now" button with a highly tactile, satisfying swipe slider.
- **Live Delivery Radar**: Post-checkout features a glowing, pulsing radar animation and a live 10-minute countdown timer, proving the "Delivery is Fast" claim visually.
- **Professional Iconography**: Built entirely with sleek `lucide-react` SVG icons.

---

## 🏗️ Architecture & Tech Stack

Amazon Now does not rebuild Amazon's storefront or logistics; it builds the **intelligence layer** on top.

### The Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS (Mobile-first, Premium Amazon Aesthetic)
- **Backend**: Node.js + Express (AWS Lambda-ready architecture)
- **Database**: AWS DynamoDB (Full product catalog with ratings, Prime badges, delivery times, and order history)
- **AI / LLM**: AgentRouter API (OpenAI-compatible) powering reasoning, vision, and vector embeddings.
- **Search**: OpenSearch Serverless (Vector retrieval)

### How the Now Agent Works
1. **Parse Intent**: Text, voice, or image → structured goal + constraints.
2. **Get Context**: Connects to Google Calendar, user history, and DynamoDB.
3. **Decompose**: Recipes/occasions into sub-needs, scaled to servings.
4. **Assemble**: One best pick per slot; prefer past reorders; substitute if out of stock.
5. **Rebalance**: Keep within budget by swapping to cheaper equivalents.
6. **Explain**: Output a cart with Trust Badges, confidence scores, and nudges.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- An **AgentRouter** account + API key
- AWS account + credentials (for DynamoDB)

### Local Setup
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure Environment (backend/.env)
AGENTROUTER_BASE_URL=https://agentrouter.org/v1
AGENTROUTER_API_KEY=<your-key>
AGENTROUTER_MODEL=<vision-capable-model-id>
AGENTROUTER_EMBED_MODEL=<embedding-model-id>
AWS_REGION=ap-south-1

# 3. Seed the Database
cd backend
npx tsx scripts/migrate-dynamodb.ts  # Migrates Amazon Metadata to DynamoDB

# 4. Start the Application
npm run dev                    # Runs backend on port 4001
cd ../frontend && npm run dev  # Runs frontend on port 5173
```

---

## 🚀 Vision: Think Big

- **Voice-First Urgent Shopping**: "I have guests in an hour."
- **Population-Scale Proactivity**: Carts that appear before the customer even opens the app.
- **Confidence as a Moat**: Explainable carts that earn trust on every purchase.

*From need to done, in seconds — for millions.*

---
<div align="center">
  <i>Built for HackOn with Amazon — Season 6.0</i>
</div>
