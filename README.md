<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" width="200"/>
  <h1>Amazon Now</h1>
  <p><strong>Delivery is fast. Now, shopping is too.</strong></p>
  <p><i>An AI-powered conversational commerce layer built for HackOn with Amazon — Season 6.0</i></p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/Frontend-React%20%2B%20TS-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
    <img alt="Node.js" src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
    <img alt="AWS Bedrock" src="https://img.shields.io/badge/AI-AWS%20Bedrock-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/>
    <img alt="DynamoDB" src="https://img.shields.io/badge/Database-DynamoDB-4053D6?style=for-the-badge&logo=amazonaws&logoColor=white"/>
  </p>
</div>

---

## 🚀 The Problem

Quick-commerce delivery is a solved problem—orders arrive in 10 minutes. **Shopping itself is not.** 
Customers arrive with an immediate, high-stress need but still have to endure friction: *search, compare, build a cart, and spend minutes deciding.* 

The friction lives **between the need and the checkout.**

| What customers do today | What they actually want |
|:---|:---|
| Type "milk" → Scroll 10 brands → Add to cart → Type "bread"... | "Breakfast for 2" → Auto-Cart → Swipe to Order |

## 💡 Our Answer: The "Now Agent"

**Amazon Now** completely reimagines urgent shopping. You tell Amazon Now your *outcome* (via text, voice, or photo), and the **Now Agent** handles the cognitive load of picking the best products, checking your budget, substituting out-of-stock items, and explaining *why* it chose what it did.

> *"kal subah breakfast, 2 log, under ₹300"* — or a photo of your empty fridge — becomes a complete, budget-checked cart. One swipe to buy.

---

## ✨ Core Pillars

### 1. Intent-to-Cart (Frictionless Shopping)
- **Multimodal Intent**: Snap a photo of an empty fridge, a handwritten list, a product box, or a recipe; the agent reads it, extracts the sub-needs, and builds the cart.
- **Recipe / Occasion-to-Cart**: "Paneer butter masala for 4" → ingredients automatically scaled to servings, smartly excluding staples you likely already own (salt, oil).
- **Automated Budget Rebalancing**: Over budget? The agent re-optimizes in real-time, swapping expensive items for cheaper equivalents ("saved ₹40 on milk"), and lets you easily revert.

### 2. Conversational Intelligence (Agentic Chat)
- **Contextual Memory**: A fully integrated messaging UI that remembers the entire conversation. If a request is too broad (e.g., "iPhone"), the agent gracefully asks follow-up questions instead of guessing.
- **Polite Substitutions**: If your requested item is out of stock, the agent won't silently swap it. It actively pauses and asks, *"Amul Butter is out of stock. Would you like me to find a substitute?"* 
- **Seamless Fallbacks**: The system auto-upgrades "Quick" mode searches into "Chat" mode seamlessly if it absolutely needs human clarification.

### 3. Proactive & Predictive Context
- **Google Calendar Sync**: Securely syncs with your Google Calendar to proactively suggest carts for upcoming events (e.g., *Birthdays, Meetings, Travel*).
- **Consumption-Rate Prediction**: Models how fast you use essentials ("2-day milk cycle → out Thursday").
- **Hyper-Local Context**: Dynamically suggests carts based on local weather (e.g., hydration packs during heatwaves) and Indian festivals.

### 4. High-Stress Emergency Mode
- **Extreme Scenarios**: One-tap SOS chips for intense emergencies like **Cut Finger** (curates first-aid, dettol, band-aids), **Burned Cooking**, or **Severe Cramps**.
- **Done in Seconds**: Bypasses the entire shopping funnel to provide exactly what is needed instantly.

### 5. Unmatched Premium UX
- **Explicit Trust Badges**: Items feature dynamic badges (🏆 Top Match, 💰 Best Value, 🌿 Vegan) driven by AI confidence scores.
- **Swipe-to-Order**: Replaces the boring "Buy Now" button with a highly tactile, satisfying swipe slider.
- **Live Delivery Radar**: Post-checkout features a glowing, pulsing radar animation and a live 10-minute countdown timer, proving the "Delivery is Fast" claim visually.

---

## 🏗️ Architecture & Tech Stack

Amazon Now does not rebuild Amazon's storefront or logistics; it builds the **intelligence layer** on top.

### The Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS (Mobile-first, Premium Amazon Aesthetic, Sleek Dark Mode)
- **Backend**: Node.js + Express (AWS Lambda-ready architecture)
- **Database**: AWS DynamoDB (Full product catalog with ratings, Prime badges, delivery times, and order history)
- **AI / LLM Reasoning**: AWS Bedrock (Nova Lite) powering reasoning, vision, and chat orchestration.
- **Embeddings**: AWS Bedrock (Titan Text Embeddings V2)
- **Search**: In-Memory Vector Search (Cosine Similarity) with intelligent caching.

### How the Now Agent Pipeline Works
1. **Parse Intent**: Converts raw input (Text, voice, or image) into a structured goal + constraints using LLM.
2. **Context Retrieval**: Injects user history, learned preferences (Avoid/Prefer), and DynamoDB profile data.
3. **Decompose**: Recipes/occasions are intelligently broken down into sub-needs and scaled to servings.
4. **Vector Search**: Performs semantic cosine-similarity searches against the catalog embeddings.
5. **Assemble & Evaluate**: LLM evaluates candidates. If out of stock, asks for substitutes via Chat. If details are missing, triggers clarifying questions.
6. **Rebalance**: Enforces budget deterministically by swapping to cheaper equivalents in the same category.
7. **Explain**: Outputs a cart with dynamic Trust Badges, confidence scores, and nudges.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- AWS account + credentials (for DynamoDB and Bedrock)
- Amazon Bedrock access enabled for:
  - `us.amazon.nova-lite-v1:0`
  - `amazon.titan-embed-text-v2:0`

### Local Setup
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure Environment (backend/.env)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:4001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173

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
  <i>Made with ❤️ for HackOn with Amazon — Season 6.0</i>
</div>
