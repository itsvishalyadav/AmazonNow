import "dotenv/config";
import fs from "fs";
import path from "path";
import { chatJSON } from "../src/services/agentrouter.js";

const CATEGORIES = [
  { category: "Birthday Party Supplies", subcategories: ["Balloons & Decor"], count: 15 },
  { category: "Birthday Party Supplies", subcategories: ["Cakes & Candles", "Return Gifts"], count: 15 },
  { category: "Festivals & Occasions", subcategories: ["Diwali & Pooja"], count: 15 },
  { category: "Festivals & Occasions", subcategories: ["Christmas Decor", "Sweets"], count: 15 },
  { category: "Weather Essentials", subcategories: ["Monsoon Care", "Umbrellas"], count: 15 },
  { category: "Weather Essentials", subcategories: ["Summer Cooling", "Skin Protection"], count: 15 },
  { category: "Party Snacks & Drinks", subcategories: ["Chips & Nachos"], count: 15 },
  { category: "Party Snacks & Drinks", subcategories: ["Cold Drinks", "Ice Cream"], count: 15 }
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

// Using imported chatJSON from agentrouter.js
// function removed as it is imported.

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
