// scripts/generate-catalog-local.ts
// Phase 1 (fallback): Generates seed data WITHOUT AgentRouter API calls.
// Uses a deterministic local embedding (vocabulary-based) so the vector search
// pipeline can still be tested end-to-end.
// Run with:  npm run seed:local  (from the backend/ directory)
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  STUB: embeddings are deterministic local vectors, not real model outputs.
//     Replace by running `npm run seed` once AgentRouter access is confirmed.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand?: string;
  price: number;
  unit: string;
  packSize?: string;
  tags: string[];
  dietary: string[];
  inStock: boolean;
  popularity: number;
  imageUrl: string;
  embedding?: number[];
  _stub?: boolean;
}

// ── Deterministic embedding ──────────────────────────────────────────────────
// Vocabulary of food/grocery terms used to build a sparse 128-dim vector.
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
];

function deterministicEmbed(text: string): number[] {
  const lower = text.toLowerCase();
  const vec = new Array(128).fill(0);
  // Fill first 112 dims from vocab matches
  VOCAB.forEach((word, i) => {
    if (i < 112 && lower.includes(word)) {
      vec[i] = 1;
      // Also activate neighbours to add variance
      if (i + 1 < 112) vec[i + 1] += 0.3;
      if (i - 1 >= 0) vec[i - 1] += 0.3;
    }
  });
  // Fill remaining 16 dims with hash of text chars to prevent zero-vectors
  for (let i = 0; i < text.length && i < 32; i++) {
    vec[112 + (i % 16)] += text.charCodeAt(i) / 1000;
  }
  // Normalise
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => Math.round((v / norm) * 10000) / 10000);
}

// ── Placeholder image ────────────────────────────────────────────────────────
function imgUrl(brand: string) {
  const label = encodeURIComponent(brand.split(" ")[0].substring(0, 6));
  return `https://placehold.co/200x200/FF9900/131A22?text=${label}`;
}

// ── Product definitions ──────────────────────────────────────────────────────
const RAW_PRODUCTS: Omit<Product, "id" | "embedding">[] = [
  // ── Grocery & Staples ─────────────────────────────────────────────────────
  // Rice & Grains
  { name:"India Gate Basmati Rice 1kg", category:"Grocery & Staples", subcategory:"Rice & Grains", brand:"India Gate", price:149, unit:"1kg", packSize:"1kg bag", tags:["basmati","rice","long grain","aromatic","cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.95, imageUrl:imgUrl("IndiaGate") },
  { name:"Tata Sampann Poha 500g", category:"Grocery & Staples", subcategory:"Rice & Grains", brand:"Tata Sampann", price:55, unit:"500g", tags:["poha","flattened rice","breakfast","quick"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.82, imageUrl:imgUrl("Tata") },
  { name:"Sona Masoori Raw Rice 5kg", category:"Grocery & Staples", subcategory:"Rice & Grains", brand:"24 Mantra", price:399, unit:"5kg", packSize:"5kg bag", tags:["sona masoori","rice","south indian","daily"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.88, imageUrl:imgUrl("24Mantra") },
  { name:"Quaker Oats 1kg", category:"Grocery & Staples", subcategory:"Rice & Grains", brand:"Quaker", price:185, unit:"1kg", tags:["oats","breakfast","fiber","healthy","rolled"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Quaker") },
  { name:"Kellogg's Cornflakes 500g", category:"Grocery & Staples", subcategory:"Rice & Grains", brand:"Kellogg's", price:135, unit:"500g", tags:["cornflakes","breakfast","cereal","quick"], dietary:["vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Kelloggs") },
  // Flours & Bread
  { name:"Aashirvaad Atta 5kg", category:"Grocery & Staples", subcategory:"Flours & Bread", brand:"Aashirvaad", price:285, unit:"5kg", packSize:"5kg bag", tags:["atta","wheat flour","chapati","roti","whole wheat"], dietary:["vegetarian"], inStock:true, popularity:0.97, imageUrl:imgUrl("Aashirvaad") },
  { name:"Britannia Brown Bread 400g", category:"Grocery & Staples", subcategory:"Flours & Bread", brand:"Britannia", price:42, unit:"400g", tags:["bread","brown bread","sandwich","breakfast","whole wheat"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Britannia") },
  { name:"Modern Sandwich White Bread 500g", category:"Grocery & Staples", subcategory:"Flours & Bread", brand:"Modern", price:38, unit:"500g", tags:["bread","white bread","sandwich","toast","sliced"], dietary:["vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Modern") },
  { name:"Pillsbury Maida 1kg", category:"Grocery & Staples", subcategory:"Flours & Bread", brand:"Pillsbury", price:68, unit:"1kg", tags:["maida","all purpose flour","baking","cooking"], dietary:["vegetarian"], inStock:true, popularity:0.70, imageUrl:imgUrl("Pillsbury") },
  { name:"Besan (Chickpea Flour) 500g", category:"Grocery & Staples", subcategory:"Flours & Bread", brand:"Patanjali", price:58, unit:"500g", tags:["besan","gram flour","chickpea","pakoda","batter"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("Patanjali") },
  // Pulses & Lentils
  { name:"Tata Sampann Toor Dal 1kg", category:"Grocery & Staples", subcategory:"Pulses & Lentils", brand:"Tata Sampann", price:175, unit:"1kg", tags:["toor dal","arhar","lentil","protein","daily cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.92, imageUrl:imgUrl("Tata") },
  { name:"24 Mantra Masoor Dal 500g", category:"Grocery & Staples", subcategory:"Pulses & Lentils", brand:"24 Mantra", price:88, unit:"500g", tags:["masoor","red lentil","protein","organic"], dietary:["vegan","vegetarian","gluten-free","organic"], inStock:true, popularity:0.78, imageUrl:imgUrl("24Mantra") },
  { name:"Rajma (Kidney Beans) 500g", category:"Grocery & Staples", subcategory:"Pulses & Lentils", brand:"BB Royal", price:75, unit:"500g", tags:["rajma","kidney beans","protein","north indian"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.80, imageUrl:imgUrl("BBRoyal") },
  { name:"Moong Dal (Split) 500g", category:"Grocery & Staples", subcategory:"Pulses & Lentils", brand:"Patanjali", price:92, unit:"500g", tags:["moong","green lentil","dal","light","protein"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.84, imageUrl:imgUrl("Patanjali") },
  { name:"Chana Dal 1kg", category:"Grocery & Staples", subcategory:"Pulses & Lentils", brand:"Tata Sampann", price:148, unit:"1kg", tags:["chana","bengal gram","dal","protein"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:false, popularity:0.75, imageUrl:imgUrl("Tata") },
  // Oils & Ghee
  { name:"Amul Pure Ghee 500ml", category:"Grocery & Staples", subcategory:"Oils & Ghee", brand:"Amul", price:295, unit:"500ml", tags:["ghee","clarified butter","cooking","indian","dairy"], dietary:["vegetarian"], inStock:true, popularity:0.95, imageUrl:imgUrl("Amul") },
  { name:"Fortune Sunflower Oil 1L", category:"Grocery & Staples", subcategory:"Oils & Ghee", brand:"Fortune", price:165, unit:"1L", tags:["sunflower oil","cooking oil","light","healthy"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.90, imageUrl:imgUrl("Fortune") },
  { name:"Saffola Gold Oil 2L", category:"Grocery & Staples", subcategory:"Oils & Ghee", brand:"Saffola", price:385, unit:"2L", tags:["rice bran oil","heart healthy","cooking oil","low cholesterol"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Saffola") },
  { name:"Figaro Olive Oil 250ml", category:"Grocery & Staples", subcategory:"Oils & Ghee", brand:"Figaro", price:255, unit:"250ml", tags:["olive oil","healthy cooking","mediterranean","light"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.68, imageUrl:imgUrl("Figaro") },
  { name:"Nandini Groundnut Oil 1L", category:"Grocery & Staples", subcategory:"Oils & Ghee", brand:"Nandini", price:195, unit:"1L", tags:["groundnut oil","peanut oil","cooking","traditional"], dietary:["vegan","vegetarian"], inStock:false, popularity:0.72, imageUrl:imgUrl("Nandini") },
  // Spices & Masalas
  { name:"Tata Salt 1kg", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Tata", price:26, unit:"1kg", tags:["salt","iodized","cooking essential","daily"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.98, imageUrl:imgUrl("Tata") },
  { name:"MDH Garam Masala 100g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"MDH", price:88, unit:"100g", tags:["garam masala","spice blend","cooking","aromatic","indian"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.90, imageUrl:imgUrl("MDH") },
  { name:"Everest Kitchen King Masala 100g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"Everest", price:78, unit:"100g", tags:["masala","spice blend","curry","cooking"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.85, imageUrl:imgUrl("Everest") },
  { name:"Catch Turmeric Powder 200g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"Catch", price:55, unit:"200g", tags:["haldi","turmeric","spice","yellow","cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.92, imageUrl:imgUrl("Catch") },
  { name:"Kashmiri Red Chilli Powder 100g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"Patanjali", price:45, unit:"100g", tags:["chilli powder","red chilli","spice","hot","cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.88, imageUrl:imgUrl("Patanjali") },
  { name:"Tata Tea Agni 500g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Tata Tea", price:198, unit:"500g", tags:["tea","chai","strong","daily","beverage"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.93, imageUrl:imgUrl("Tata") },
  { name:"Amul Sugar 1kg", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Amul", price:48, unit:"1kg", tags:["sugar","white sugar","cooking","sweet"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.90, imageUrl:imgUrl("Amul") },
  // ── Dairy & Eggs ──────────────────────────────────────────────────────────
  { name:"Amul Taaza Milk 1L", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Amul", price:68, unit:"1L", tags:["milk","full cream","fresh","dairy","daily"], dietary:["vegetarian"], inStock:true, popularity:0.98, imageUrl:imgUrl("Amul") },
  { name:"Amul Taaza Milk 500ml", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Amul", price:34, unit:"500ml", tags:["milk","full cream","fresh","dairy"], dietary:["vegetarian"], inStock:true, popularity:0.95, imageUrl:imgUrl("Amul") },
  { name:"Nestlé a+ Nangrow Milk 1L", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Nestlé", price:82, unit:"1L", tags:["toned milk","low fat","daily","healthy"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Nestle") },
  { name:"Amul Dahi 400g", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Amul", price:48, unit:"400g", tags:["dahi","curd","yogurt","fresh","probiotic"], dietary:["vegetarian"], inStock:true, popularity:0.92, imageUrl:imgUrl("Amul") },
  { name:"Mother Dairy Mishti Doi 200g", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Mother Dairy", price:35, unit:"200g", tags:["mishti doi","sweet curd","bengali","dessert"], dietary:["vegetarian"], inStock:true, popularity:0.72, imageUrl:imgUrl("MotherDairy") },
  { name:"Amul Fresh Paneer 200g", category:"Dairy & Eggs", subcategory:"Paneer & Cheese", brand:"Amul", price:88, unit:"200g", tags:["paneer","cottage cheese","fresh","protein","vegetarian"], dietary:["vegetarian"], inStock:true, popularity:0.94, imageUrl:imgUrl("Amul") },
  { name:"Amul Fresh Paneer 400g", category:"Dairy & Eggs", subcategory:"Paneer & Cheese", brand:"Amul", price:172, unit:"400g", tags:["paneer","cottage cheese","cooking","protein"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Amul") },
  { name:"Amul Processed Cheese Slice 200g", category:"Dairy & Eggs", subcategory:"Paneer & Cheese", brand:"Amul", price:115, unit:"200g", packSize:"Pack of 10", tags:["cheese slice","processed cheese","sandwich","burger"], dietary:["vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Amul") },
  { name:"Amul Butter 500g", category:"Dairy & Eggs", subcategory:"Butter & Cream", brand:"Amul", price:278, unit:"500g", tags:["butter","salted butter","spread","cooking","bread"], dietary:["vegetarian"], inStock:true, popularity:0.95, imageUrl:imgUrl("Amul") },
  { name:"Amul Butter 100g", category:"Dairy & Eggs", subcategory:"Butter & Cream", brand:"Amul", price:58, unit:"100g", tags:["butter","salted butter","spread","daily"], dietary:["vegetarian"], inStock:true, popularity:0.90, imageUrl:imgUrl("Amul") },
  { name:"Amul Fresh Cream 200ml", category:"Dairy & Eggs", subcategory:"Butter & Cream", brand:"Amul", price:68, unit:"200ml", tags:["cream","fresh cream","cooking","dessert","gravy"], dietary:["vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Amul") },
  { name:"Farm Fresh Eggs 6pc", category:"Dairy & Eggs", subcategory:"Eggs", brand:"Nandus", price:68, unit:"6 pcs", packSize:"Pack of 6", tags:["eggs","white eggs","protein","breakfast","fresh"], dietary:[], inStock:true, popularity:0.92, imageUrl:imgUrl("Nandus") },
  { name:"Farm Fresh Eggs 12pc", category:"Dairy & Eggs", subcategory:"Eggs", brand:"Nandus", price:128, unit:"12 pcs", packSize:"Dozen", tags:["eggs","dozen","protein","breakfast"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Nandus") },
  // ── Fruits & Vegetables ───────────────────────────────────────────────────
  { name:"Tomatoes 500g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:28, unit:"500g", tags:["tomato","fresh vegetable","cooking","curry","salad"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.95, imageUrl:imgUrl("FarmFresh") },
  { name:"Onions 1kg", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:38, unit:"1kg", tags:["onion","sabzi","cooking","essential","daily"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.97, imageUrl:imgUrl("FarmFresh") },
  { name:"Potatoes 1kg", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:32, unit:"1kg", tags:["potato","aloo","vegetable","cooking","curry"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.96, imageUrl:imgUrl("FarmFresh") },
  { name:"Garlic 100g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:22, unit:"100g", tags:["garlic","lehsun","spice","cooking","aromatic"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.88, imageUrl:imgUrl("FarmFresh") },
  { name:"Ginger 100g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:18, unit:"100g", tags:["ginger","adrak","spice","tea","cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.90, imageUrl:imgUrl("FarmFresh") },
  { name:"Green Chillies 100g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:15, unit:"100g", tags:["green chilli","chilli","spicy","cooking","fresh"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.85, imageUrl:imgUrl("FarmFresh") },
  { name:"Coriander Leaves (Dhania) 50g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:12, unit:"50g", tags:["coriander","dhania","herb","garnish","fresh"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.88, imageUrl:imgUrl("FarmFresh") },
  { name:"Spinach (Palak) 250g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:25, unit:"250g", tags:["spinach","palak","leafy vegetable","healthy","iron"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.75, imageUrl:imgUrl("FarmFresh") },
  { name:"Capsicum (Red) 250g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:48, unit:"250g", tags:["capsicum","bell pepper","red pepper","salad","cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:false, popularity:0.72, imageUrl:imgUrl("FarmFresh") },
  { name:"Lady Finger (Bhindi) 250g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:32, unit:"250g", tags:["bhindi","okra","lady finger","sabzi","vegetable"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.78, imageUrl:imgUrl("FarmFresh") },
  { name:"Cauliflower (Phool Gobhi) 1pc", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:45, unit:"1 piece", tags:["cauliflower","gobhi","vegetable","sabzi","curry"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.80, imageUrl:imgUrl("FarmFresh") },
  { name:"Brinjal (Baingan) 500g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:30, unit:"500g", tags:["baingan","brinjal","eggplant","bharta","sabzi"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.70, imageUrl:imgUrl("FarmFresh") },
  { name:"Bananas 6pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:48, unit:"6 pcs", packSize:"Pack of 6", tags:["banana","fruit","fresh","energy","potassium"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.90, imageUrl:imgUrl("FreshFarm") },
  { name:"Apples (Shimla) 4pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:90, unit:"4 pcs", tags:["apple","shimla apple","fruit","healthy","fiber"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.85, imageUrl:imgUrl("FreshFarm") },
  { name:"Sweet Lime (Mosambi) 4pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:65, unit:"4 pcs", tags:["mosambi","sweet lime","citrus","juice","vitamin c"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.80, imageUrl:imgUrl("FreshFarm") },
  { name:"Pomegranate 1pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:78, unit:"1 piece", tags:["pomegranate","anar","fruit","antioxidant","healthy"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.78, imageUrl:imgUrl("FreshFarm") },
  { name:"Watermelon (Mini) 1pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:120, unit:"1 piece", tags:["watermelon","summer fruit","hydration","cool","sweet"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:false, popularity:0.75, imageUrl:imgUrl("FreshFarm") },
  { name:"Grapes (Green Seedless) 500g", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:88, unit:"500g", tags:["grapes","green grapes","fruit","snack","sweet"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("FreshFarm") },
  // ── Beverages ─────────────────────────────────────────────────────────────
  { name:"Tata Tea Gold 250g", category:"Beverages", subcategory:"Tea & Coffee", brand:"Tata Tea", price:145, unit:"250g", tags:["tea","chai","premium","aromatic","daily"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.92, imageUrl:imgUrl("Tata") },
  { name:"Bru Original Coffee 100g", category:"Beverages", subcategory:"Tea & Coffee", brand:"Bru", price:138, unit:"100g", tags:["coffee","instant coffee","morning","filter coffee"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Bru") },
  { name:"Nescafé Classic Coffee 100g", category:"Beverages", subcategory:"Tea & Coffee", brand:"Nescafé", price:168, unit:"100g", tags:["coffee","instant","nescafe","morning","caffeine"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Nescafe") },
  { name:"Tetley Green Tea 25 bags", category:"Beverages", subcategory:"Tea & Coffee", brand:"Tetley", price:135, unit:"25 bags", packSize:"Pack of 25", tags:["green tea","healthy","antioxidant","herbal","light"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("Tetley") },
  { name:"Real Mango Juice 1L", category:"Beverages", subcategory:"Juices", brand:"Real", price:95, unit:"1L", tags:["mango juice","fruit juice","tetrapack","summer","sweet"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Real") },
  { name:"Paper Boat Aam Panna 200ml", category:"Beverages", subcategory:"Juices", brand:"Paper Boat", price:25, unit:"200ml", tags:["aam panna","raw mango","summer drink","cooler"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("PaperBoat") },
  { name:"Frooti Mango Drink 600ml", category:"Beverages", subcategory:"Juices", brand:"Frooti", price:40, unit:"600ml", tags:["frooti","mango drink","fruit drink","chilled"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Frooti") },
  { name:"Coca-Cola 750ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Coca-Cola", price:45, unit:"750ml", tags:["cola","cold drink","fizzy","party","refreshing"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("CocaCola") },
  { name:"Sprite 750ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Sprite", price:45, unit:"750ml", tags:["sprite","lime soda","cold drink","fizzy","refreshing"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Sprite") },
  { name:"Limca 600ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Limca", price:40, unit:"600ml", tags:["limca","lemon soda","fizzy","cold drink"], dietary:["vegan","vegetarian"], inStock:false, popularity:0.72, imageUrl:imgUrl("Limca") },
  { name:"Bisleri Water 1L", category:"Beverages", subcategory:"Water & Electrolytes", brand:"Bisleri", price:20, unit:"1L", tags:["water","mineral water","bisleri","drinking water"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.92, imageUrl:imgUrl("Bisleri") },
  { name:"Bisleri Water 500ml", category:"Beverages", subcategory:"Water & Electrolytes", brand:"Bisleri", price:12, unit:"500ml", tags:["water","mineral water","small","portable"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.90, imageUrl:imgUrl("Bisleri") },
  { name:"Electral ORS Lemon 4.4g (21 sachets)", category:"Beverages", subcategory:"Water & Electrolytes", brand:"Electral", price:118, unit:"21 sachets", packSize:"Pack of 21", tags:["ors","oral rehydration","electrolyte","sick","dehydration","lemon"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Electral") },
  { name:"Gatorade Orange 500ml", category:"Beverages", subcategory:"Water & Electrolytes", brand:"Gatorade", price:85, unit:"500ml", tags:["sports drink","electrolyte","energy","hydration","exercise"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.72, imageUrl:imgUrl("Gatorade") },
  // ── Snacks & Packaged Foods ───────────────────────────────────────────────
  { name:"Parle-G Biscuits 200g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"Parle", price:30, unit:"200g", tags:["biscuit","glucose biscuit","tea time","snack","cheap"], dietary:["vegetarian"], inStock:true, popularity:0.95, imageUrl:imgUrl("Parle") },
  { name:"Britannia Marie Gold 250g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"Britannia", price:48, unit:"250g", tags:["marie biscuit","light biscuit","tea time","healthy"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Britannia") },
  { name:"Good Day Butter Biscuits 200g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"Britannia", price:38, unit:"200g", tags:["butter biscuit","good day","cookies","snack","sweet"], dietary:["vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Britannia") },
  { name:"Lay's Magic Masala Chips 73g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Lay's", price:20, unit:"73g", tags:["chips","lays","potato chips","snack","masala"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Lays") },
  { name:"Bingo Mad Angles 50g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Bingo", price:20, unit:"50g", tags:["bingo","puffed snack","chips","masala","crispy"], dietary:["vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Bingo") },
  { name:"Haldiram's Aloo Bhujia 200g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Haldiram's", price:58, unit:"200g", tags:["namkeen","bhujia","sev","snack","savory"], dietary:["vegetarian","gluten-free"], inStock:true, popularity:0.90, imageUrl:imgUrl("Haldirams") },
  { name:"Maggi 2-Minute Noodles 70g", category:"Snacks & Packaged Foods", subcategory:"Noodles & Pasta", brand:"Maggi", price:14, unit:"70g", tags:["maggi","noodles","instant","quick","2 minute"], dietary:["vegetarian"], inStock:true, popularity:0.95, imageUrl:imgUrl("Maggi") },
  { name:"Maggi 2-Minute Noodles 4pk 280g", category:"Snacks & Packaged Foods", subcategory:"Noodles & Pasta", brand:"Maggi", price:52, unit:"280g", packSize:"Pack of 4", tags:["maggi","noodles","instant","family pack","value"], dietary:["vegetarian"], inStock:true, popularity:0.92, imageUrl:imgUrl("Maggi") },
  { name:"Sunfeast Pasta 200g", category:"Snacks & Packaged Foods", subcategory:"Noodles & Pasta", brand:"Sunfeast", price:45, unit:"200g", tags:["pasta","penne","italian","quick cook"], dietary:["vegetarian"], inStock:true, popularity:0.72, imageUrl:imgUrl("Sunfeast") },
  { name:"MTR Ready To Eat Dal Makhani 300g", category:"Snacks & Packaged Foods", subcategory:"Ready-to-Eat", brand:"MTR", price:88, unit:"300g", tags:["ready to eat","dal makhani","instant","travel","quick meal"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("MTR") },
  { name:"MTR Poha Mix 180g", category:"Snacks & Packaged Foods", subcategory:"Ready-to-Eat", brand:"MTR", price:48, unit:"180g", tags:["poha mix","instant breakfast","quick","easy"], dietary:["vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("MTR") },
  { name:"Haldiram's Chana Jor Garam 80g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Haldiram's", price:15, unit:"80g", tags:["chana","snack","roasted","chatpata","namkeen"], dietary:["vegan","vegetarian","gluten-free"], inStock:true, popularity:0.82, imageUrl:imgUrl("Haldirams") },
  // ── Baby Care ─────────────────────────────────────────────────────────────
  { name:"Nestlé CERELAC Rice Stage 1 300g", category:"Baby Care", subcategory:"Baby Food", brand:"Nestlé", price:250, unit:"300g", tags:["baby food","cerelac","rice","infant","stage 1","6 months"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Nestle") },
  { name:"Nestlé CERELAC Wheat Apple 300g", category:"Baby Care", subcategory:"Baby Food", brand:"Nestlé", price:265, unit:"300g", tags:["baby food","cerelac","wheat apple","8 months","toddler"], dietary:["vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Nestle") },
  { name:"Pampers Baby Dry Diapers S 20pc", category:"Baby Care", subcategory:"Diapers & Wipes", brand:"Pampers", price:349, unit:"20 pcs", packSize:"Pack of 20", tags:["diapers","pampers","small","baby","absorbent"], dietary:[], inStock:true, popularity:0.90, imageUrl:imgUrl("Pampers") },
  { name:"Pampers Baby Dry Diapers M 18pc", category:"Baby Care", subcategory:"Diapers & Wipes", brand:"Pampers", price:378, unit:"18 pcs", packSize:"Pack of 18", tags:["diapers","pampers","medium","baby","overnight"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Pampers") },
  { name:"Huggies Wonder Pants M 36pc", category:"Baby Care", subcategory:"Diapers & Wipes", brand:"Huggies", price:648, unit:"36 pcs", tags:["diapers","huggies","pants","medium","pull up"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("Huggies") },
  { name:"Pampers Baby Wipes 72pc", category:"Baby Care", subcategory:"Diapers & Wipes", brand:"Pampers", price:198, unit:"72 pcs", tags:["baby wipes","pampers","gentle","sensitive","clean"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Pampers") },
  { name:"Johnson's Baby Powder 100g", category:"Baby Care", subcategory:"Baby Hygiene", brand:"Johnson's", price:98, unit:"100g", tags:["baby powder","talcum","gentle","rash","baby care"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("Johnsons") },
  { name:"Himalaya Baby Shampoo 400ml", category:"Baby Care", subcategory:"Baby Hygiene", brand:"Himalaya", price:175, unit:"400ml", tags:["baby shampoo","gentle","tear free","natural","baby hair"], dietary:[], inStock:false, popularity:0.80, imageUrl:imgUrl("Himalaya") },
  { name:"Dabur Lal Tail 100ml", category:"Baby Care", subcategory:"Baby Hygiene", brand:"Dabur", price:95, unit:"100ml", tags:["baby oil","massage oil","ayurvedic","baby care","warm"], dietary:[], inStock:true, popularity:0.75, imageUrl:imgUrl("Dabur") },
  // ── Health & OTC ──────────────────────────────────────────────────────────
  { name:"Electral ORS Sachet 4.4g", category:"Health & OTC", subcategory:"ORS & Electrolytes", brand:"Electral", price:12, unit:"1 sachet", tags:["ors","rehydration","electrolyte","diarrhea","dehydration","sick"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.90, imageUrl:imgUrl("Electral") },
  { name:"Pedialyte Sachets (3pk)", category:"Health & OTC", subcategory:"ORS & Electrolytes", brand:"Pedialyte", price:78, unit:"3 sachets", packSize:"Pack of 3", tags:["ors","children","electrolyte","sick","dehydration"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Pedialyte") },
  { name:"Crocin Pain Relief 500mg (15 tabs)", category:"Health & OTC", subcategory:"Pain Relief", brand:"Crocin", price:28, unit:"15 tabs", packSize:"Strip of 15", tags:["crocin","paracetamol","fever","headache","pain relief","tablet"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.92, imageUrl:imgUrl("Crocin") },
  { name:"Dolo 650mg (15 tabs)", category:"Health & OTC", subcategory:"Pain Relief", brand:"Dolo", price:32, unit:"15 tabs", packSize:"Strip of 15", tags:["dolo 650","paracetamol","fever","pain","headache","medicine"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.95, imageUrl:imgUrl("Dolo") },
  { name:"Ibugesic Suspension 100ml", category:"Health & OTC", subcategory:"Pain Relief", brand:"Cipla", price:68, unit:"100ml", tags:["ibuprofen","fever syrup","children","pain relief"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Cipla") },
  { name:"Supradyn Multivitamin 15 tabs", category:"Health & OTC", subcategory:"Vitamins & Supplements", brand:"Bayer", price:148, unit:"15 tabs", tags:["multivitamin","vitamin","supplement","immunity","daily health"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Bayer") },
  { name:"Limcee Vitamin C 500mg (15 tabs)", category:"Health & OTC", subcategory:"Vitamins & Supplements", brand:"Abbott", price:38, unit:"15 tabs", tags:["vitamin c","immunity","ascorbic acid","supplement","cold"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Abbott") },
  { name:"Zincovit Tablet (15 tabs)", category:"Health & OTC", subcategory:"Vitamins & Supplements", brand:"Apex", price:82, unit:"15 tabs", tags:["zinc","multivitamin","immunity","supplement","vitamins"], dietary:["vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("Apex") },
  { name:"Band-Aid Flexible Fabric 10pc", category:"Health & OTC", subcategory:"First Aid", brand:"Band-Aid", price:55, unit:"10 pcs", packSize:"Pack of 10", tags:["band aid","bandage","first aid","wound","cut"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("BandAid") },
  { name:"Dettol Antiseptic Liquid 100ml", category:"Health & OTC", subcategory:"First Aid", brand:"Dettol", price:68, unit:"100ml", tags:["dettol","antiseptic","wound care","first aid","disinfectant"], dietary:[], inStock:true, popularity:0.90, imageUrl:imgUrl("Dettol") },
  { name:"Betadine Solution 30ml", category:"Health & OTC", subcategory:"First Aid", brand:"Win-Medicare", price:55, unit:"30ml", tags:["betadine","povidone iodine","antiseptic","wound","first aid"], dietary:[], inStock:false, popularity:0.72, imageUrl:imgUrl("Betadine") },
  // ── Home & Cleaning ───────────────────────────────────────────────────────
  { name:"Surf Excel Easy Wash 1kg", category:"Home & Cleaning", subcategory:"Detergents", brand:"Surf Excel", price:175, unit:"1kg", tags:["detergent","washing powder","surf excel","clothes","laundry"], dietary:[], inStock:true, popularity:0.92, imageUrl:imgUrl("SurfExcel") },
  { name:"Ariel Matic Front Load 1kg", category:"Home & Cleaning", subcategory:"Detergents", brand:"Ariel", price:195, unit:"1kg", tags:["ariel","detergent","washing machine","front load","matic"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Ariel") },
  { name:"Harpic Power Plus 500ml", category:"Home & Cleaning", subcategory:"Surface Cleaners", brand:"Harpic", price:98, unit:"500ml", tags:["harpic","toilet cleaner","bathroom","disinfectant","cleaning"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Harpic") },
  { name:"Colin Glass Cleaner 500ml", category:"Home & Cleaning", subcategory:"Surface Cleaners", brand:"Colin", price:78, unit:"500ml", tags:["colin","glass cleaner","mirror","window","spray"], dietary:[], inStock:true, popularity:0.82, imageUrl:imgUrl("Colin") },
  { name:"Lizol Floor Cleaner Floral 500ml", category:"Home & Cleaning", subcategory:"Surface Cleaners", brand:"Lizol", price:118, unit:"500ml", tags:["lizol","floor cleaner","disinfectant","floral","mopping"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("Lizol") },
  { name:"Vim Dishwash Bar 200g", category:"Home & Cleaning", subcategory:"Dishwash", brand:"Vim", price:28, unit:"200g", tags:["vim","dishwash bar","utensils","cleaning","soap"], dietary:[], inStock:true, popularity:0.90, imageUrl:imgUrl("Vim") },
  { name:"Pril Dishwash Liquid 500ml", category:"Home & Cleaning", subcategory:"Dishwash", brand:"Pril", price:92, unit:"500ml", tags:["pril","dishwash liquid","utensils","grease","lemon"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("Pril") },
  { name:"Godrej aer Spray Fresh Linen 240ml", category:"Home & Cleaning", subcategory:"Fresheners", brand:"Godrej aer", price:148, unit:"240ml", tags:["air freshener","room freshener","linen","godrej","aer"], dietary:[], inStock:true, popularity:0.78, imageUrl:imgUrl("Godrej") },
  { name:"Good Knight Advanced Liquid Refill 45ml", category:"Home & Cleaning", subcategory:"Fresheners", brand:"Good Knight", price:95, unit:"45ml", tags:["mosquito repellent","goodnight","liquid refill","protection"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("GoodKnight") },
  { name:"Dettol Handwash Liquid 250ml", category:"Home & Cleaning", subcategory:"Surface Cleaners", brand:"Dettol", price:78, unit:"250ml", tags:["handwash","dettol","liquid soap","hygiene","germ protection"], dietary:[], inStock:true, popularity:0.92, imageUrl:imgUrl("Dettol") },
  { name:"Odonil Room Freshener 50g", category:"Home & Cleaning", subcategory:"Fresheners", brand:"Odonil", price:55, unit:"50g", tags:["room freshener","odonil","bathroom freshener","fragrance"], dietary:[], inStock:false, popularity:0.70, imageUrl:imgUrl("Odonil") },
  // ── Personal Care ─────────────────────────────────────────────────────────
  { name:"Dove Cream Beauty Bathing Bar 100g", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Dove", price:55, unit:"100g", tags:["dove","soap","moisturizing","skin","bathing bar"], dietary:[], inStock:true, popularity:0.90, imageUrl:imgUrl("Dove") },
  { name:"Dettol Original Soap 125g", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Dettol", price:45, unit:"125g", tags:["dettol soap","antibacterial","protection","hygiene","germ kill"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Dettol") },
  { name:"Lifebuoy Total 10 Soap 125g", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Lifebuoy", price:35, unit:"125g", tags:["lifebuoy","soap","antibacterial","hygiene","protection"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("Lifebuoy") },
  { name:"Dove Shampoo Intense Repair 180ml", category:"Personal Care", subcategory:"Shampoos", brand:"Dove", price:148, unit:"180ml", tags:["shampoo","dove","hair repair","damaged hair","moisturizing"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Dove") },
  { name:"Pantene Advanced Hairfall Solution 180ml", category:"Personal Care", subcategory:"Shampoos", brand:"Pantene", price:165, unit:"180ml", tags:["shampoo","pantene","hairfall","keratin","strong hair"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("Pantene") },
  { name:"Head & Shoulders Anti-Dandruff 180ml", category:"Personal Care", subcategory:"Shampoos", brand:"Head & Shoulders", price:152, unit:"180ml", tags:["shampoo","dandruff","head and shoulders","scalp","clean"], dietary:[], inStock:false, popularity:0.82, imageUrl:imgUrl("HeadShoulders") },
  { name:"Colgate Strong Teeth Toothpaste 200g", category:"Personal Care", subcategory:"Toothpaste & Oral Care", brand:"Colgate", price:72, unit:"200g", tags:["toothpaste","colgate","dental care","cavity protection","daily"], dietary:[], inStock:true, popularity:0.92, imageUrl:imgUrl("Colgate") },
  { name:"Pepsodent Germicheck Toothpaste 150g", category:"Personal Care", subcategory:"Toothpaste & Oral Care", brand:"Pepsodent", price:58, unit:"150g", tags:["toothpaste","pepsodent","germ protection","strong teeth"], dietary:[], inStock:true, popularity:0.82, imageUrl:imgUrl("Pepsodent") },
  { name:"Oral-B Toothbrush Soft 2pc", category:"Personal Care", subcategory:"Toothpaste & Oral Care", brand:"Oral-B", price:95, unit:"2 pcs", packSize:"Pack of 2", tags:["toothbrush","oral b","soft bristle","dental care","gum protection"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("OralB") },
  // Extra products to reach 200+
  { name:"Amul Kool Chocolate Milk 200ml", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Amul", price:28, unit:"200ml", tags:["chocolate milk","amul kool","flavoured milk","cold","drink"], dietary:["vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Amul") },
  { name:"Complan Chocolate 500g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Complan", price:295, unit:"500g", tags:["complan","health drink","children","growth","chocolate","protein"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Complan") },
  { name:"Horlicks Classic Malt 500g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Horlicks", price:245, unit:"500g", tags:["horlicks","malt drink","health","children","morning","milk"], dietary:["vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Horlicks") },
  { name:"Boost Chocolate Health Drink 500g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Boost", price:265, unit:"500g", tags:["boost","energy drink","chocolate","sports","health","milk"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Boost") },
  { name:"Cadbury Bournvita 500g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Cadbury", price:258, unit:"500g", tags:["bournvita","chocolate malt","health drink","children","energy"], dietary:["vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Cadbury") },
  { name:"Kissan Mixed Fruit Jam 500g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Kissan", price:125, unit:"500g", tags:["jam","fruit jam","kissan","bread spread","sweet"], dietary:["vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Kissan") },
  { name:"Maggi Tomato Ketchup 1kg", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Maggi", price:138, unit:"1kg", tags:["ketchup","tomato sauce","maggi","condiment","dipping"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Maggi") },
  { name:"Heinz Tomato Ketchup 600g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"Heinz", price:158, unit:"600g", tags:["ketchup","heinz","tomato","sauce","condiment"], dietary:["vegan","vegetarian"], inStock:false, popularity:0.75, imageUrl:imgUrl("Heinz") },
  { name:"Mother's Recipe Mango Pickle 400g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"Mother's Recipe", price:88, unit:"400g", tags:["pickle","mango pickle","achaar","condiment","spicy"], dietary:["vegan","vegetarian","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("Mothers") },
  { name:"Lijjat Papad 200g", category:"Snacks & Packaged Foods", subcategory:"Ready-to-Eat", brand:"Lijjat", price:48, unit:"200g", tags:["papad","lijjat","crispy","snack","indian"], dietary:["vegan","vegetarian","jain"], inStock:true, popularity:0.85, imageUrl:imgUrl("Lijjat") },
  { name:"Bikano Chana Chur 200g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Bikano", price:45, unit:"200g", tags:["namkeen","chana chur","savory","snack","crunchy"], dietary:["vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Bikano") },
  { name:"Priya Andhra Pickle 300g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"Priya", price:65, unit:"300g", tags:["pickle","andhra","spicy","lemon pickle","south indian"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.72, imageUrl:imgUrl("Priya") },
  { name:"Nestle KitKat 4 Finger 45g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"Nestlé", price:35, unit:"45g", tags:["chocolate","kitkat","wafer","sweet","snack"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Nestle") },
  { name:"Cadbury Dairy Milk 45g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"Cadbury", price:40, unit:"45g", tags:["chocolate","dairy milk","cadbury","sweet","snack"], dietary:["vegetarian"], inStock:true, popularity:0.90, imageUrl:imgUrl("Cadbury") },
  { name:"Perk Chocolate 38g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"Cadbury", price:20, unit:"38g", tags:["chocolate","perk","wafer","sweet","budget snack"], dietary:["vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Cadbury") },
  { name:"Real Guava Juice 1L", category:"Beverages", subcategory:"Juices", brand:"Real", price:88, unit:"1L", tags:["guava juice","amrood","juice","tetrapak","vitamin c"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.72, imageUrl:imgUrl("Real") },
  { name:"Maaza Mango Drink 600ml", category:"Beverages", subcategory:"Juices", brand:"Maaza", price:42, unit:"600ml", tags:["maaza","mango drink","chilled","fruit drink","sweet"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Maaza") },
  { name:"Thumbs Up Cola 750ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Thums Up", price:45, unit:"750ml", tags:["thums up","cola","cold drink","fizzy","strong"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("ThumsUp") },
  { name:"Mountain Dew 600ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Mountain Dew", price:40, unit:"600ml", tags:["mountain dew","lime soda","fizzy","cold drink","energy"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("MtnDew") },
  { name:"Kinley Soda 750ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Kinley", price:25, unit:"750ml", tags:["soda","club soda","kinley","mixer","sparkling water"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("Kinley") },
  { name:"Rin Advance Bar 250g", category:"Home & Cleaning", subcategory:"Detergents", brand:"Rin", price:28, unit:"250g", tags:["rin","washing bar","detergent","clothes","whitening"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Rin") },
  { name:"Nirma Detergent Powder 1kg", category:"Home & Cleaning", subcategory:"Detergents", brand:"Nirma", price:68, unit:"1kg", tags:["nirma","detergent powder","budget","laundry","economy"], dietary:[], inStock:true, popularity:0.80, imageUrl:imgUrl("Nirma") },
  { name:"Scotch-Brite Scrub Pad 3pc", category:"Home & Cleaning", subcategory:"Dishwash", brand:"Scotch-Brite", price:68, unit:"3 pcs", packSize:"Pack of 3", tags:["scrub pad","scotch brite","kitchen scourer","cleaning","utensils"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("ScotchBrite") },
  { name:"Pril Dishwash Bar Lemon 150g", category:"Home & Cleaning", subcategory:"Dishwash", brand:"Pril", price:25, unit:"150g", tags:["pril bar","dishwash","utensils","grease removal","lemon"], dietary:[], inStock:true, popularity:0.80, imageUrl:imgUrl("Pril") },
  { name:"Fiama Di Wills Body Wash 200ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Fiama", price:135, unit:"200ml", tags:["body wash","shower gel","fiama","moisturizing","fragrant"], dietary:[], inStock:true, popularity:0.75, imageUrl:imgUrl("Fiama") },
  { name:"Neem Face Wash 100ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Himalaya", price:118, unit:"100ml", tags:["face wash","neem","himalaya","pimple","acne","daily"], dietary:[], inStock:true, popularity:0.80, imageUrl:imgUrl("Himalaya") },
  { name:"Vaseline Body Lotion 200ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Vaseline", price:148, unit:"200ml", tags:["lotion","moisturizer","vaseline","body lotion","dry skin"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("Vaseline") },
  { name:"Nivea Soft Cream 100ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Nivea", price:125, unit:"100ml", tags:["nivea","face cream","moisturizing","soft","daily"], dietary:[], inStock:false, popularity:0.80, imageUrl:imgUrl("Nivea") },
  { name:"Old Spice Deo 150ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Old Spice", price:145, unit:"150ml", tags:["deodorant","old spice","men","fragrance","deo"], dietary:[], inStock:true, popularity:0.78, imageUrl:imgUrl("OldSpice") },
  { name:"Wild Stone Deo 150ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Wild Stone", price:155, unit:"150ml", tags:["deodorant","wild stone","men","fragrance","deo"], dietary:[], inStock:true, popularity:0.75, imageUrl:imgUrl("WildStone") },
  // Paneer butter masala ingredients
  { name:"Amul Butter Unsalted 500g", category:"Dairy & Eggs", subcategory:"Butter & Cream", brand:"Amul", price:282, unit:"500g", tags:["butter","unsalted","cooking","baking","paneer butter masala"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Amul") },
  { name:"Cashews (Kaju) 200g", category:"Grocery & Staples", subcategory:"Sugar, Salt & Other", brand:"BB Royal", price:185, unit:"200g", tags:["cashew","kaju","dry fruit","gravy","rich","cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.85, imageUrl:imgUrl("BBRoyal") },
  { name:"Kasuri Methi 100g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"Catch", price:38, unit:"100g", tags:["kasuri methi","dried fenugreek","spice","paneer","butter masala"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.78, imageUrl:imgUrl("Catch") },
  { name:"Amul Fresh Cream 200ml (cooking)", category:"Dairy & Eggs", subcategory:"Butter & Cream", brand:"Amul", price:72, unit:"200ml", tags:["cream","cooking cream","gravy","dal makhani","paneer","rich"], dietary:["vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Amul") },
  // Emergency / health items
  { name:"Vicks VapoRub 50ml", category:"Health & OTC", subcategory:"First Aid", brand:"Vicks", price:88, unit:"50ml", tags:["vicks","vapour rub","cold relief","nasal","chest congestion","sick"], dietary:[], inStock:true, popularity:0.90, imageUrl:imgUrl("Vicks") },
  { name:"Strepsils Honey & Lemon 24 lozenges", category:"Health & OTC", subcategory:"Pain Relief", brand:"Strepsils", price:98, unit:"24 lozenges", tags:["strepsils","throat lozenges","sore throat","cough","honey lemon"], dietary:["vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Strepsils") },
  { name:"Dabur Hajmola Regular 120 tabs", category:"Health & OTC", subcategory:"First Aid", brand:"Dabur", price:45, unit:"120 tabs", tags:["hajmola","digestive","churan","stomach","acidity","dabur"], dietary:["vegetarian","jain"], inStock:true, popularity:0.85, imageUrl:imgUrl("Dabur") },
  { name:"Eno Fruit Salt Regular 5g (30 sachets)", category:"Health & OTC", subcategory:"First Aid", brand:"Eno", price:98, unit:"30 sachets", tags:["eno","antacid","acidity","gas relief","stomach"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Eno") },
  { name:"Digene Gel Orange 200ml", category:"Health & OTC", subcategory:"Pain Relief", brand:"Digene", price:125, unit:"200ml", tags:["digene","antacid gel","acidity","heartburn","stomach relief"], dietary:["vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Digene") },
  // Festival / occasion items
  { name:"Haldiram's Kaju Katli 200g", category:"Snacks & Packaged Foods", subcategory:"Ready-to-Eat", brand:"Haldiram's", price:295, unit:"200g", tags:["kaju katli","sweet","mithai","festival","diwali","gift"], dietary:["vegetarian","gluten-free"], inStock:true, popularity:0.88, imageUrl:imgUrl("Haldirams") },
  { name:"Patanjali Atta Noodles 70g", category:"Snacks & Packaged Foods", subcategory:"Noodles & Pasta", brand:"Patanjali", price:18, unit:"70g", tags:["noodles","atta noodles","whole wheat","patanjali","quick","healthy"], dietary:["vegetarian"], inStock:true, popularity:0.70, imageUrl:imgUrl("Patanjali") },
  { name:"Del Monte Pasta Penne 500g", category:"Snacks & Packaged Foods", subcategory:"Noodles & Pasta", brand:"Del Monte", price:88, unit:"500g", tags:["pasta","penne","italian","cooking","premium"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.72, imageUrl:imgUrl("DelMonte") },
  { name:"Roasted Peanuts Salted 200g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Nutraj", price:55, unit:"200g", tags:["peanuts","roasted","salted","snack","protein","healthy"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("Nutraj") },
  { name:"Fox Nuts (Makhana) 100g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Farmley", price:88, unit:"100g", tags:["makhana","fox nuts","healthy snack","roasted","light","vrat"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.78, imageUrl:imgUrl("Farmley") },
  // ── More Grocery & Staples ────────────────────────────────────────────────
  { name:"Tata Sampann Urad Dal 500g", category:"Grocery & Staples", subcategory:"Pulses & Lentils", brand:"Tata Sampann", price:95, unit:"500g", tags:["urad dal","black lentil","dal makhani","protein"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("Tata") },
  { name:"Aashirvaad Multigrain Atta 5kg", category:"Grocery & Staples", subcategory:"Flours & Bread", brand:"Aashirvaad", price:315, unit:"5kg", tags:["multigrain atta","wheat flour","healthy","fiber","chapati"], dietary:["vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("Aashirvaad") },
  { name:"Daawat Basmati Rice 5kg", category:"Grocery & Staples", subcategory:"Rice & Grains", brand:"Daawat", price:595, unit:"5kg", tags:["basmati","premium rice","biryani","long grain","aromatic"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.88, imageUrl:imgUrl("Daawat") },
  { name:"MDH Rajma Masala 100g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"MDH", price:78, unit:"100g", tags:["rajma masala","spice blend","kidney bean","north indian"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("MDH") },
  { name:"Everest Chole Masala 50g", category:"Grocery & Staples", subcategory:"Spices & Masalas", brand:"Everest", price:38, unit:"50g", tags:["chole masala","chickpea","spice","curry","punjabi"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.80, imageUrl:imgUrl("Everest") },
  { name:"Saffola Active Cooking Oil 1L", category:"Grocery & Staples", subcategory:"Oils & Ghee", brand:"Saffola", price:195, unit:"1L", tags:["cooking oil","healthy","low fat","saffola","daily"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Saffola") },
  { name:"Amul Lite Butter 100g", category:"Dairy & Eggs", subcategory:"Butter & Cream", brand:"Amul", price:62, unit:"100g", tags:["lite butter","low fat butter","spread","healthy"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Amul") },
  // ── More Dairy ────────────────────────────────────────────────────────────
  { name:"Amul Gold Milk 1L", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Amul", price:72, unit:"1L", tags:["full cream milk","gold","rich","dairy","daily"], dietary:["vegetarian"], inStock:true, popularity:0.90, imageUrl:imgUrl("Amul") },
  { name:"Epigamia Greek Yogurt Mango 90g", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Epigamia", price:40, unit:"90g", tags:["greek yogurt","mango","protein","healthy snack","probiotic"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Epigamia") },
  { name:"Verka Lassi Mango 200ml", category:"Dairy & Eggs", subcategory:"Milk & Curd", brand:"Verka", price:28, unit:"200ml", tags:["lassi","mango","buttermilk","sweet","dairy drink"], dietary:["vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("Verka") },
  // ── More Fruits & Vegetables ──────────────────────────────────────────────
  { name:"Peas (Matar) 200g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:35, unit:"200g", tags:["peas","matar","green peas","vegetable","cooking"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("FarmFresh") },
  { name:"Carrot (Gajar) 500g", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:30, unit:"500g", tags:["carrot","gajar","vegetable","salad","juice","healthy"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.80, imageUrl:imgUrl("FarmFresh") },
  { name:"Cucumber (Kheera) 2pc", category:"Fruits & Vegetables", subcategory:"Fresh Vegetables", brand:"Farm Fresh", price:25, unit:"2 pcs", tags:["cucumber","kheera","salad","raita","cooling"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.78, imageUrl:imgUrl("FarmFresh") },
  { name:"Orange 4pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:75, unit:"4 pcs", tags:["orange","fruit","vitamin c","citrus","fresh"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.82, imageUrl:imgUrl("FreshFarm") },
  { name:"Kiwi 3pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:95, unit:"3 pcs", tags:["kiwi","fruit","vitamin c","exotic","healthy"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:false, popularity:0.70, imageUrl:imgUrl("FreshFarm") },
  { name:"Pineapple 1pc", category:"Fruits & Vegetables", subcategory:"Fresh Fruits", brand:"Fresh Farm", price:85, unit:"1 piece", tags:["pineapple","fruit","tropical","sweet","summer"], dietary:["vegan","vegetarian","gluten-free","jain"], inStock:true, popularity:0.72, imageUrl:imgUrl("FreshFarm") },
  // ── More Beverages ────────────────────────────────────────────────────────
  { name:"Chaayos Kadak Chai 50g", category:"Beverages", subcategory:"Tea & Coffee", brand:"Chaayos", price:95, unit:"50g", tags:["chai","masala tea","kadak","ginger","strong tea"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Chaayos") },
  { name:"Sleepy Owl Cold Brew Coffee 250ml", category:"Beverages", subcategory:"Tea & Coffee", brand:"Sleepy Owl", price:155, unit:"250ml", tags:["cold brew","coffee","premium","ready to drink","chilled"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.72, imageUrl:imgUrl("Sleepy") },
  { name:"Tropicana Mixed Fruit Juice 1L", category:"Beverages", subcategory:"Juices", brand:"Tropicana", price:110, unit:"1L", tags:["mixed fruit juice","tropicana","tetrapack","vitamin","daily"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Tropicana") },
  { name:"Sting Energy Drink 250ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Sting", price:35, unit:"250ml", tags:["energy drink","sting","caffeine","boost","workout"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Sting") },
  { name:"Red Bull Energy Drink 250ml", category:"Beverages", subcategory:"Cold Drinks", brand:"Red Bull", price:125, unit:"250ml", tags:["energy drink","red bull","caffeine","premium","wings"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("RedBull") },
  { name:"Nandini Buttermilk 200ml", category:"Beverages", subcategory:"Water & Electrolytes", brand:"Nandini", price:18, unit:"200ml", tags:["buttermilk","chaas","cooling","digestive","summer drink"], dietary:["vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Nandini") },
  // ── More Snacks ───────────────────────────────────────────────────────────
  { name:"Kurkure Masala Munch 90g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Kurkure", price:20, unit:"90g", tags:["kurkure","puffed snack","masala","crispy","spicy"], dietary:["vegetarian"], inStock:true, popularity:0.90, imageUrl:imgUrl("Kurkure") },
  { name:"Cornitos Nachos Cheese 150g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Cornitos", price:68, unit:"150g", tags:["nachos","cheese","tortilla chips","party snack","crispy"], dietary:["vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("Cornitos") },
  { name:"Sunfeast Mom's Magic Biscuits 200g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"Sunfeast", price:35, unit:"200g", tags:["biscuit","butter cookies","sweet","snack","tea time"], dietary:["vegetarian"], inStock:true, popularity:0.80, imageUrl:imgUrl("Sunfeast") },
  { name:"ITC Dark Fantasy Cookies 300g", category:"Snacks & Packaged Foods", subcategory:"Biscuits & Cookies", brand:"ITC", price:115, unit:"300g", tags:["cookies","dark fantasy","chocolate filling","premium","sweet"], dietary:["vegetarian"], inStock:true, popularity:0.85, imageUrl:imgUrl("ITC") },
  { name:"Yippee Noodles Magic Masala 70g", category:"Snacks & Packaged Foods", subcategory:"Noodles & Pasta", brand:"Yippee", price:14, unit:"70g", tags:["noodles","yippee","instant","masala","quick"], dietary:["vegetarian"], inStock:true, popularity:0.88, imageUrl:imgUrl("Yippee") },
  { name:"Wai Wai Noodles 70g", category:"Snacks & Packaged Foods", subcategory:"Noodles & Pasta", brand:"Wai Wai", price:15, unit:"70g", tags:["noodles","wai wai","instant","spicy","nepal"], dietary:["vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("WaiWai") },
  { name:"Haldiram's Bhujia Sev 400g", category:"Snacks & Packaged Foods", subcategory:"Chips & Namkeen", brand:"Haldiram's", price:98, unit:"400g", tags:["sev","bhujia","namkeen","family pack","savory"], dietary:["vegetarian","gluten-free"], inStock:true, popularity:0.88, imageUrl:imgUrl("Haldirams") },
  // ── More Health & OTC ─────────────────────────────────────────────────────
  { name:"Burnol Antiseptic Cream 20g", category:"Health & OTC", subcategory:"First Aid", brand:"Dr. Morepen", price:42, unit:"20g", tags:["burnol","burn cream","first aid","antiseptic","wound"], dietary:[], inStock:true, popularity:0.80, imageUrl:imgUrl("Burnol") },
  { name:"Himalaya Liv.52 DS 60 tabs", category:"Health & OTC", subcategory:"Vitamins & Supplements", brand:"Himalaya", price:165, unit:"60 tabs", tags:["liver supplement","himalaya","ayurvedic","detox","health"], dietary:["vegetarian"], inStock:true, popularity:0.75, imageUrl:imgUrl("Himalaya") },
  { name:"Patanjali Ashwagandha 60 tabs", category:"Health & OTC", subcategory:"Vitamins & Supplements", brand:"Patanjali", price:95, unit:"60 tabs", tags:["ashwagandha","immunity","stress","ayurvedic","patanjali"], dietary:["vegetarian"], inStock:true, popularity:0.78, imageUrl:imgUrl("Patanjali") },
  { name:"Disprin Aspirin 325mg (10 tabs)", category:"Health & OTC", subcategory:"Pain Relief", brand:"Reckitt", price:12, unit:"10 tabs", tags:["disprin","aspirin","headache","fever","pain","tablet"], dietary:["vegan","vegetarian"], inStock:true, popularity:0.82, imageUrl:imgUrl("Disprin") },
  // ── More Home & Cleaning ──────────────────────────────────────────────────
  { name:"Fena Bar Detergent 250g", category:"Home & Cleaning", subcategory:"Detergents", brand:"Fena", price:22, unit:"250g", tags:["detergent bar","fena","budget","clothes","washing"], dietary:[], inStock:true, popularity:0.75, imageUrl:imgUrl("Fena") },
  { name:"Ujala Fabric Whitener 500ml", category:"Home & Cleaning", subcategory:"Detergents", brand:"Ujala", price:68, unit:"500ml", tags:["ujala","fabric whitener","brightener","clothes","blue"], dietary:[], inStock:true, popularity:0.80, imageUrl:imgUrl("Ujala") },
  { name:"Domex Floor Cleaner 500ml", category:"Home & Cleaning", subcategory:"Surface Cleaners", brand:"Domex", price:88, unit:"500ml", tags:["domex","floor cleaner","toilet cleaner","disinfectant","white"], dietary:[], inStock:true, popularity:0.82, imageUrl:imgUrl("Domex") },
  { name:"HIT Cockroach Killer Spray 200ml", category:"Home & Cleaning", subcategory:"Fresheners", brand:"HIT", price:158, unit:"200ml", tags:["cockroach killer","pest control","spray","hit","instant kill"], dietary:[], inStock:true, popularity:0.85, imageUrl:imgUrl("HIT") },
  // ── More Personal Care ────────────────────────────────────────────────────
  { name:"Parachute Coconut Oil 100ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Parachute", price:75, unit:"100ml", tags:["coconut oil","hair oil","parachute","natural","moisturizing"], dietary:[], inStock:true, popularity:0.88, imageUrl:imgUrl("Parachute") },
  { name:"Bajaj Almond Drops Hair Oil 200ml", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Bajaj", price:125, unit:"200ml", tags:["hair oil","almond","non sticky","shine","bajaj"], dietary:[], inStock:true, popularity:0.82, imageUrl:imgUrl("Bajaj") },
  { name:"Sensodyne Rapid Relief Toothpaste 70g", category:"Personal Care", subcategory:"Toothpaste & Oral Care", brand:"Sensodyne", price:145, unit:"70g", tags:["toothpaste","sensodyne","sensitive teeth","pain relief","enamel"], dietary:[], inStock:true, popularity:0.80, imageUrl:imgUrl("Sensodyne") },
  { name:"Gillette Vector 3 Blades (2pc)", category:"Personal Care", subcategory:"Soaps & Bodywash", brand:"Gillette", price:165, unit:"2 pcs", tags:["razor","blades","gillette","shaving","men"], dietary:[], inStock:true, popularity:0.78, imageUrl:imgUrl("Gillette") },
];


// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Amazon Now — Phase 1: Local Catalog (STUB)      ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("⚠️  Using deterministic local embeddings (not AgentRouter).");
  console.log("   Run `npm run seed` once API access is confirmed.\n");

  const dataDir = path.join(__dirname, "..", "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Data directory: ${dataDir}\n`);

  // 1. Assign IDs + embeddings
  console.log(`🔢 Embedding ${RAW_PRODUCTS.length} products (deterministic local)...`);
  const products: Product[] = RAW_PRODUCTS.map((p, i) => {
    const embText = [p.name, p.subcategory, p.category, ...p.tags].join(" ");
    return {
      ...p,
      id: `prod-${String(i + 1).padStart(4, "0")}`,
      embedding: deterministicEmbed(embText),
      _stub: true,
    };
  });
  console.log(`✅ ${products.length} products embedded\n`);

  // 2. Write catalog
  const catalogPath = path.join(dataDir, "seed-catalog.json");
  fs.writeFileSync(catalogPath, JSON.stringify(products, null, 2));
  console.log(`💾 Catalog written to ${catalogPath}`);
  console.log(`   Size: ${(fs.statSync(catalogPath).size / 1024).toFixed(1)} KB\n`);

  // 3. Write seed user
  const user = {
    id: "user-demo-01",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    city: "Bengaluru",
    household: { size: 4, dietary: ["vegetarian"], budgetSensitivity: "med" },
    defaultBudget: 800,
    learnedPrefs: { avoid: [], prefer: [] },
  };
  const userPath = path.join(dataDir, "seed-user.json");
  fs.writeFileSync(userPath, JSON.stringify(user, null, 2));
  console.log(`👤 Seed user written to ${userPath}`);

  // 4. Write seed orders (pick high-popularity, in-stock products)
  const orderable = products.filter((p) => p.inStock && p.popularity > 0.5);
  const pick = (n: number) =>
    Array.from({ length: n }, () => ({
      productId: orderable[Math.floor(Math.random() * orderable.length)].id,
      qty: Math.random() > 0.7 ? 2 : 1,
    }));

  const now = Date.now();
  const DAY = 86400000;
  const orders = [
    { id: "ord-001", userId: "user-demo-01", items: pick(6), createdAt: new Date(now - 2 * DAY).toISOString() },
    { id: "ord-002", userId: "user-demo-01", items: pick(4), createdAt: new Date(now - 4 * DAY).toISOString() },
    { id: "ord-003", userId: "user-demo-01", items: pick(8), createdAt: new Date(now - 7 * DAY).toISOString() },
    { id: "ord-004", userId: "user-demo-01", items: pick(5), createdAt: new Date(now - 9 * DAY).toISOString() },
    { id: "ord-005", userId: "user-demo-01", items: pick(7), createdAt: new Date(now - 14 * DAY).toISOString() },
    { id: "ord-006", userId: "user-demo-01", items: pick(3), createdAt: new Date(now - 16 * DAY).toISOString() },
    { id: "ord-007", userId: "user-demo-01", items: pick(6), createdAt: new Date(now - 21 * DAY).toISOString() },
    { id: "ord-008", userId: "user-demo-01", items: pick(9), createdAt: new Date(now - 24 * DAY).toISOString() },
    { id: "ord-009", userId: "user-demo-01", items: pick(4), createdAt: new Date(now - 28 * DAY).toISOString() },
    { id: "ord-010", userId: "user-demo-01", items: pick(5), createdAt: new Date(now - 30 * DAY).toISOString() },
    { id: "ord-011", userId: "user-demo-01", items: pick(6), createdAt: new Date(now - 35 * DAY).toISOString() },
    { id: "ord-012", userId: "user-demo-01", items: pick(3), createdAt: new Date(now - 38 * DAY).toISOString() },
    { id: "ord-013", userId: "user-demo-01", items: pick(7), createdAt: new Date(now - 42 * DAY).toISOString() },
    { id: "ord-014", userId: "user-demo-01", items: pick(5), createdAt: new Date(now - 45 * DAY).toISOString() },
    { id: "ord-015", userId: "user-demo-01", items: pick(8), createdAt: new Date(now - 50 * DAY).toISOString() },
  ];
  const ordersPath = path.join(dataDir, "seed-orders.json");
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
  console.log(`📦 Seed orders (${orders.length}) written to ${ordersPath}\n`);

  // 5. Report
  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.length - inStockCount;
  const embDim = products[0]?.embedding?.length ?? 0;

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Phase 1 Complete! ✅                            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  Products:       ${products.length}`);
  console.log(`  Embedding dim:  ${embDim} (local STUB)`);
  console.log(`  In stock:       ${inStockCount} (${((inStockCount / products.length) * 100).toFixed(0)}%)`);
  console.log(`  Out of stock:   ${outOfStockCount} (~${((outOfStockCount / products.length) * 100).toFixed(0)}%)`);
  console.log(`  Files:`);
  console.log(`    ${catalogPath}`);
  console.log(`    ${userPath}`);
  console.log(`    ${ordersPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
