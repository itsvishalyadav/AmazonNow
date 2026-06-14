import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_FILE = path.join(__dirname, "..", "src", "data", "seed-catalog.json");

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRating() {
  // Biased towards 4.0 - 4.8
  const base = Math.random() > 0.2 ? 4.0 : 3.5;
  const rating = base + Math.random() * 0.9;
  return Math.round(rating * 10) / 10;
}

function migrate() {
  console.log("Loading catalog...");
  const data = fs.readFileSync(CATALOG_FILE, "utf-8");
  const catalog = JSON.parse(data);

  console.log(`Migrating ${catalog.length} products...`);
  
  let modifiedCount = 0;
  
  for (const product of catalog) {
    if (!product.rating) {
      product.rating = randomRating();
      product.reviewCount = randomInt(15, 12000);
      product.isPrime = Math.random() > 0.15; // 85% chance of prime
      
      // Assign delivery times
      const r = Math.random();
      if (r < 0.4) product.deliveryTime = "10 mins";
      else if (r < 0.7) product.deliveryTime = "15 mins";
      else if (r < 0.9) product.deliveryTime = "Same Day";
      else product.deliveryTime = "Next Day";
      
      // Also the user asked to add images to ALL products if missing.
      // We'll assign a placeholder based on category.
      if (!product.imageUrl) {
         const encodedName = encodeURIComponent(product.name.split(" ").join(""));
         product.imageUrl = `https://picsum.photos/seed/${encodedName}/200/200`;
      }
      modifiedCount++;
    }
  }

  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
  console.log(`Done! Added metadata to ${modifiedCount} products.`);
}

migrate();
