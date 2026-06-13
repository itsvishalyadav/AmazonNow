// scripts/generate-catalog.ts
// Phase 1: Generates + embeds the seed catalog via AgentRouter.
// Run with: npm run seed  (from the backend/ directory)
// ─────────────────────────────────────────────────────────────────────────────
// This script is designed to be run from the backend/ directory.
// It loads backend/.env for API keys, then calls AgentRouter to
// generate + embed 200+ products, and writes seed data files.

import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand?: string;
  price: number; // INR
  unit: string;
  packSize?: string;
  tags: string[];
  dietary: string[];
  inStock: boolean;
  popularity: number; // 0-1
  imageUrl: string;
  embedding?: number[];
}

// ── AgentRouter client ───────────────────────────────────────────────────────
const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY!,
  baseURL: process.env.AGENTROUTER_BASE_URL!,
});

const MODEL = process.env.AGENTROUTER_MODEL ?? "gpt-4o";
const EMBED_MODEL = process.env.AGENTROUTER_EMBED_MODEL ?? "text-embedding-3-small";

// ── Helpers ──────────────────────────────────────────────────────────────────
async function embed(text: string): Promise<number[]> {
  const res = await client.embeddings.create({ model: EMBED_MODEL, input: text });
  return res.data[0].embedding;
}

async function chatJSON(system: string, user: string): Promise<any> {
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0].message.content!;
  try {
    return JSON.parse(raw);
  } catch {
    // repair retry
    const repair = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No prose." },
        { role: "user", content: `Fix this malformed JSON:\n${raw}` },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return JSON.parse(repair.choices[0].message.content!);
  }
}

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    category: "Grocery & Staples",
    subcategories: [
      "Rice & Grains",
      "Flours & Bread",
      "Pulses & Lentils",
      "Oils & Ghee",
      "Spices & Masalas",
      "Sugar, Salt & Other",
    ],
    count: 50,
  },
  {
    category: "Dairy & Eggs",
    subcategories: ["Milk & Curd", "Paneer & Cheese", "Butter & Cream", "Eggs"],
    count: 30,
  },
  {
    category: "Fruits & Vegetables",
    subcategories: ["Fresh Vegetables", "Fresh Fruits"],
    count: 35,
  },
  {
    category: "Beverages",
    subcategories: ["Tea & Coffee", "Juices", "Cold Drinks", "Water & Electrolytes"],
    count: 25,
  },
  {
    category: "Snacks & Packaged Foods",
    subcategories: ["Biscuits & Cookies", "Chips & Namkeen", "Noodles & Pasta", "Ready-to-Eat"],
    count: 30,
  },
  {
    category: "Baby Care",
    subcategories: ["Baby Food", "Diapers & Wipes", "Baby Hygiene"],
    count: 15,
  },
  {
    category: "Health & OTC",
    subcategories: ["ORS & Electrolytes", "Pain Relief", "Vitamins & Supplements", "First Aid"],
    count: 20,
  },
  {
    category: "Home & Cleaning",
    subcategories: ["Detergents", "Surface Cleaners", "Dishwash", "Fresheners"],
    count: 20,
  },
  {
    category: "Personal Care",
    subcategories: ["Soaps & Bodywash", "Shampoos", "Toothpaste & Oral Care"],
    count: 15,
  },
];

// ── Prompt builder ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a product catalog generator for an Indian quick-commerce grocery/essentials app (like Amazon Now / Blinkit / Zepto). Generate realistic, detailed product data for India.

Rules:
- Prices in Indian Rupees (INR), realistic for Indian quick-commerce
- Mix of national brands (Amul, Tata, Nestle, ITC, HUL, P&G, Dettol, Surf, etc.) and generics
- dietary array: any of ["vegan", "vegetarian", "gluten-free", "dairy-free", "organic", "jain"]
- tags: 3-6 searchable terms relevant to the product
- popularity: float 0–1 (most items 0.3–0.9, hero items near 1.0)
- imageUrl: use format "https://placehold.co/200x200/FF9900/131A22?text=Brand" (replace Brand with first word of brand)
- inStock: set ~10% to false (for substitution demo)
- unit: realistic unit like "500g", "1L", "6 pcs", "250ml", "pack", "dozen"
- packSize: optional, e.g. "Pack of 6", "1kg bag"
- Return JSON: { "products": [ ...array of Product objects... ] }`;

function buildUserPrompt(category: string, subcategories: string[], batchSize: number, batchOffset: number): string {
  return `Generate exactly ${batchSize} diverse products for the category "${category}".
Cover these subcategories spread across products: ${subcategories.join(", ")}.

Each product must be a JSON object with these exact fields:
- id: string like "prod-${batchOffset + 1}" (sequential, starting from ${batchOffset + 1})
- name: specific product name with brand (e.g. "Amul Taaza Milk 500ml", "Tata Salt 1kg")
- category: "${category}"
- subcategory: one of [${subcategories.map((s) => `"${s}"`).join(", ")}]
- brand: string (brand name)
- price: number (realistic INR price)
- unit: string (size/unit)
- packSize: string or null
- tags: array of 3-6 search terms
- dietary: array (from: vegan, vegetarian, gluten-free, dairy-free, organic, jain)
- inStock: boolean (90% true, 10% false)
- popularity: number between 0.3 and 1.0
- imageUrl: "https://placehold.co/200x200/FF9900/131A22?text=Brand"

IMPORTANT: Return JSON object with key "products" containing an array of exactly ${batchSize} products.`;
}

// ── Main catalog generation ──────────────────────────────────────────────────
async function generateCatalog(): Promise<Product[]> {
  const allProducts: Product[] = [];
  let globalId = 1;

  for (const cat of CATEGORIES) {
    console.log(`\n📦 Generating ${cat.count} products for: ${cat.category}`);

    const BATCH_SIZE = 25; // generate in batches to stay within token limits
    const batches = Math.ceil(cat.count / BATCH_SIZE);

    for (let b = 0; b < batches; b++) {
      const batchSize = Math.min(BATCH_SIZE, cat.count - b * BATCH_SIZE);
      const batchOffset = globalId - 1;
      console.log(`   Batch ${b + 1}/${batches} (${batchSize} products)...`);

      try {
        const result = await chatJSON(
          SYSTEM_PROMPT,
          buildUserPrompt(cat.category, cat.subcategories, batchSize, batchOffset)
        );

        const products: Product[] = (result.products ?? result.items ?? []).slice(0, batchSize);
        for (const p of products) {
          // Normalise + assign global ID
          p.id = `prod-${String(globalId++).padStart(4, "0")}`;
          p.category = cat.category;
          if (!p.tags || !Array.isArray(p.tags)) p.tags = [];
          if (!p.dietary || !Array.isArray(p.dietary)) p.dietary = [];
          if (typeof p.inStock !== "boolean") p.inStock = Math.random() > 0.1;
          if (typeof p.popularity !== "number") p.popularity = Math.random() * 0.6 + 0.3;
          if (!p.imageUrl) {
            const shortName = ((p.brand ?? p.name) as string).split(" ")[0];
            p.imageUrl = `https://placehold.co/200x200/FF9900/131A22?text=${encodeURIComponent(shortName)}`;
          }
          allProducts.push(p);
        }

        console.log(`   ✅ ${products.length} products added (total: ${allProducts.length})`);
      } catch (err: any) {
        console.error(`   ❌ Batch failed:`, err?.message ?? err);
      }

      // Brief pause to avoid rate limiting
      if (b < batches - 1) await new Promise((r) => setTimeout(r, 800));
    }
  }

  return allProducts;
}

// ── Embedding ────────────────────────────────────────────────────────────────
async function embedProducts(products: Product[]): Promise<Product[]> {
  console.log(`\n🔢 Embedding ${products.length} products...`);
  const BATCH_SIZE = 20;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    console.log(`   Embedding ${i + 1}–${Math.min(i + BATCH_SIZE, products.length)} / ${products.length}`);

    await Promise.all(
      batch.map(async (p) => {
        const text = [p.name, p.subcategory, p.category, ...(p.tags ?? [])].join(" ");
        p.embedding = await embed(text);
      })
    );

    // Pause between batches
    if (i + BATCH_SIZE < products.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`   ✅ All products embedded`);
  return products;
}

// ── Seed user ────────────────────────────────────────────────────────────────
function writeSeedUser(dataDir: string): void {
  const user = {
    id: "user-demo-01",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    city: "Bengaluru",
    household: {
      size: 4,
      dietary: ["vegetarian"],
      budgetSensitivity: "med",
    },
    defaultBudget: 800,
    learnedPrefs: {
      avoid: [],
      prefer: [],
    },
  };

  const outPath = path.join(dataDir, "seed-user.json");
  fs.writeFileSync(outPath, JSON.stringify(user, null, 2));
  console.log(`\n👤 Seed user written to ${outPath}`);
}

// ── Seed orders ───────────────────────────────────────────────────────────────
function writeSeedOrders(dataDir: string, products: Product[]): void {
  const userId = "user-demo-01";
  const now = Date.now();
  const DAY = 86400000;

  // Pick popular, in-stock products for order history
  const orderableProducts = products.filter((p) => p.inStock && p.popularity > 0.5).slice(0, 80);
  const pick = (n: number) =>
    Array.from({ length: n }, () => ({
      productId: orderableProducts[Math.floor(Math.random() * orderableProducts.length)].id,
      qty: Math.random() > 0.7 ? 2 : 1,
    }));

  const orders = [
    { id: "ord-001", userId, items: pick(6), createdAt: new Date(now - 2 * DAY).toISOString() },
    { id: "ord-002", userId, items: pick(4), createdAt: new Date(now - 4 * DAY).toISOString() },
    { id: "ord-003", userId, items: pick(8), createdAt: new Date(now - 7 * DAY).toISOString() },
    { id: "ord-004", userId, items: pick(5), createdAt: new Date(now - 9 * DAY).toISOString() },
    { id: "ord-005", userId, items: pick(7), createdAt: new Date(now - 14 * DAY).toISOString() },
    { id: "ord-006", userId, items: pick(3), createdAt: new Date(now - 16 * DAY).toISOString() },
    { id: "ord-007", userId, items: pick(6), createdAt: new Date(now - 21 * DAY).toISOString() },
    { id: "ord-008", userId, items: pick(9), createdAt: new Date(now - 24 * DAY).toISOString() },
    { id: "ord-009", userId, items: pick(4), createdAt: new Date(now - 28 * DAY).toISOString() },
    { id: "ord-010", userId, items: pick(5), createdAt: new Date(now - 30 * DAY).toISOString() },
    { id: "ord-011", userId, items: pick(6), createdAt: new Date(now - 35 * DAY).toISOString() },
    { id: "ord-012", userId, items: pick(3), createdAt: new Date(now - 38 * DAY).toISOString() },
    { id: "ord-013", userId, items: pick(7), createdAt: new Date(now - 42 * DAY).toISOString() },
    { id: "ord-014", userId, items: pick(5), createdAt: new Date(now - 45 * DAY).toISOString() },
    { id: "ord-015", userId, items: pick(8), createdAt: new Date(now - 50 * DAY).toISOString() },
  ];

  const outPath = path.join(dataDir, "seed-orders.json");
  fs.writeFileSync(outPath, JSON.stringify(orders, null, 2));
  console.log(`📦 Seed orders (${orders.length}) written to ${outPath}`);
}

// ── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Amazon Now — Phase 1: Catalog Generation        ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Model: ${MODEL}`);
  console.log(`Embed model: ${EMBED_MODEL}`);
  console.log(`AgentRouter URL: ${process.env.AGENTROUTER_BASE_URL}\n`);

  if (!process.env.AGENTROUTER_API_KEY) {
    console.error("❌ AGENTROUTER_API_KEY not set. Check backend/.env");
    process.exit(1);
  }

  // Resolve data dir relative to this script (not CWD)
  // __dirname = backend/scripts/  → ../src/data  (i.e. backend/src/data)
  const dataDir = path.join(__dirname, "..", "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Data directory: ${dataDir}\n`);

  // 1. Generate catalog
  const products = await generateCatalog();
  console.log(`\n✅ Generated ${products.length} products total`);

  if (products.length < 100) {
    console.warn(`⚠️  Only ${products.length} products — expected 200+. Check API responses.`);
  }

  // 2. Embed all products
  const embedded = await embedProducts(products);

  // Verify embedding consistency
  const embLen = embedded[0]?.embedding?.length ?? 0;
  const allSameLen = embedded.every((p) => (p.embedding?.length ?? 0) === embLen);
  const outOfStock = embedded.filter((p) => !p.inStock).length;

  console.log(`\n📐 Embedding dimension: ${embLen}`);
  console.log(`📐 Consistent length: ${allSameLen}`);
  console.log(`📊 Out of stock: ${outOfStock}/${embedded.length} (${((outOfStock / embedded.length) * 100).toFixed(1)}%)`);

  // 3. Write catalog
  const catalogPath = path.join(dataDir, "seed-catalog.json");
  fs.writeFileSync(catalogPath, JSON.stringify(embedded, null, 2));
  console.log(`\n💾 Catalog written to ${catalogPath}`);
  console.log(`   Size: ${(fs.statSync(catalogPath).size / 1024 / 1024).toFixed(2)} MB`);

  // 4. Write seed user + orders
  writeSeedUser(dataDir);
  writeSeedOrders(dataDir, embedded);

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  Phase 1 Complete! ✅                            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  Products:       ${embedded.length}`);
  console.log(`  Embedding dim:  ${embLen}`);
  console.log(`  Out of stock:   ${outOfStock}`);
  console.log(`  Files written:`);
  console.log(`    backend/src/data/seed-catalog.json`);
  console.log(`    backend/src/data/seed-user.json`);
  console.log(`    backend/src/data/seed-orders.json`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
