import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.AGENTROUTER_API_KEY!,
  baseURL: process.env.AGENTROUTER_BASE_URL!,
});

const MODEL = process.env.AGENTROUTER_MODEL ?? "gpt-4o";

const CATEGORIES = [
  { category: "Party Supplies", subcategories: ["Snacks", "Beverages", "Disposables", "Ice"], count: 25 },
  { category: "Baking Needs", subcategories: ["Flours", "Essence & Colors", "Chocolate & Cocoa", "Baking Tools"], count: 25 },
  { category: "Pooja Needs", subcategories: ["Agarbatti & Dhoop", "Pooja Ghee & Oil", "Items & Accessories"], count: 25 },
  { category: "Pet Care", subcategories: ["Dog Food", "Cat Food", "Pet Grooming"], count: 20 },
  { category: "Instant & Frozen Food", subcategories: ["Frozen Snacks", "Ready to Cook", "Desserts"], count: 30 },
  { category: "Gourmet & World Food", subcategories: ["Pasta & Noodles", "Sauces & Spreads", "Exotic Veggies"], count: 30 },
];

const VOCAB = [
  "milk","curd","paneer","cheese","butter","ghee","cream","egg","bread","flour",
  "rice","dal","pulses","oil","spice","masala","salt","sugar","tea","coffee",
  "juice","water","drink","snack","biscuit","chip","noodle","pasta","soup","sauce",
  "shampoo","soap","detergent","cleaner","dishwash","toothpaste","toothbrush",
  "baby","diaper","wipe","food","cereal","ors","vitamin","supplement","painkiller",
  "fruit","vegetable","tomato","potato","onion","garlic","ginger","lemon","banana",
  "apple","mango","wheat","oats","cornflakes","muesli","jam","ketchup","pickle",
  "yogurt","lassi","buttermilk","protein","fiber","vegan","organic","gluten",
  "amul","tata","nestle","itc","hul","dettol","surf","dove","colgate","maggi",
  "britannia","parle","haldiram","patanjali","dabur","himalaya","johnson","pepsico",
  "fresh","instant","ready","healthy","natural","cold","hot","sweet","salty","spicy",
  "breakfast","lunch","dinner","snacking","cooking","baking","cleaning","hygiene",
  "pack","bottle","bag","box","can","sachet","kg","gram","liter","ml","piece",
  "daily","weekly","essential","staple","premium","economy","value","family","size",
  "indian","regional","national","brand","generic","local","imported","certified",
  "grocery","dairy","beverage","personal","care","home","baby","health","otc",
  "vegetarian","jain","diabetic","allergen","low","high","calorie","sodium","fat",
  "party", "ice", "pet", "dog", "cat", "pooja", "agarbatti", "frozen", "pizza"
];

function deterministicEmbed(text: string): number[] {
  const lower = text.toLowerCase();
  const vec = new Array(128).fill(0);
  VOCAB.forEach((word, i) => {
    if (i < 112 && lower.includes(word)) {
      vec[i] = 1;
      if (i + 1 < 112) vec[i + 1] += 0.3;
      if (i - 1 >= 0) vec[i - 1] += 0.3;
    }
  });
  for (let i = 0; i < text.length && i < 32; i++) {
    vec[112 + (i % 16)] += text.charCodeAt(i) / 1000;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => Math.round((v / norm) * 10000) / 10000);
}

const SYSTEM_PROMPT = `You are a product catalog generator for an Indian quick-commerce grocery app.
Generate realistic, detailed product data for India.
Prices in INR. Mix national brands and generics.
Tags should be 3-6 searchable terms. popularity: float 0-1.
inStock: 90% true.
Return JSON: { "products": [ ...array of Product objects... ] }`;

function buildUserPrompt(category: string, subcategories: string[], batchSize: number, batchOffset: number): string {
  return `Generate exactly ${batchSize} diverse products for the category "${category}".
Cover subcategories: ${subcategories.join(", ")}.

Fields for each product:
- id: "prod-${batchOffset + 1}" (sequential)
- name: string
- category: "${category}"
- subcategory: string
- brand: string
- price: number
- unit: string
- packSize: string or null
- tags: string[]
- dietary: string[]
- inStock: boolean
- popularity: number

Return JSON { "products": [...] }`;
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
  return JSON.parse(res.choices[0].message.content!);
}

async function main() {
  const catalogPath = path.join(__dirname, "..", "src", "data", "seed-catalog.json");
  let existing = [];
  if (fs.existsSync(catalogPath)) {
    existing = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
  }

  let globalId = existing.length > 0 ? parseInt(existing[existing.length-1].id.split('-')[1]) + 1 : 1000;

  for (const cat of CATEGORIES) {
    console.log(`Generating ${cat.count} products for ${cat.category}...`);
    try {
      const result = await chatJSON(
        SYSTEM_PROMPT,
        buildUserPrompt(cat.category, cat.subcategories, cat.count, globalId)
      );
      
      const products = result.products || [];
      for (const p of products) {
        p.id = `prod-${String(globalId++).padStart(4, "0")}`;
        p.category = cat.category;
        const shortName = ((p.brand ?? p.name) as string).split(" ")[0];
        p.imageUrl = `https://placehold.co/200x200/FF9900/131A22?text=${encodeURIComponent(shortName)}`;
        p._stub = true;
        p.embedding = deterministicEmbed([p.name, p.subcategory, p.category, ...(p.tags || [])].join(" "));
        existing.push(p);
      }
      console.log(`Added ${products.length} products.`);
    } catch (err) {
      console.error("Error generating batch:", err);
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(existing, null, 2));
  console.log(`Saved ${existing.length} total products to seed-catalog.json!`);
}

main();
