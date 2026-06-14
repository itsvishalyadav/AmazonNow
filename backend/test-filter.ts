import "dotenv/config";
import { search } from "./src/services/vectorSearch.js";
import { initCatalog, all } from "./src/services/catalog.js";

async function run() {
  await initCatalog();
  const catalog = all();
  const filters = { dietary: [] };
  
  const { category, subcategory, maxPrice, dietary = [], inStockOnly = true } = filters;
  const candidates = catalog.filter((p) => {
    if (inStockOnly && !p.inStock) return false;
    if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
    if (subcategory && p.subcategory.toLowerCase() !== subcategory.toLowerCase()) return false;
    if (maxPrice !== undefined && p.price > maxPrice) return false;
    if (dietary.length > 0) {
      const isFoodCategory = !["Health & OTC", "Personal Care", "Home & Cleaning", "Pet Care", "Stationery"].includes(p.category);
      if (isFoodCategory && !dietary.every((d) => p.dietary.includes(d))) {
        return false;
      }
    }
    return true;
  });
  
  const eggsInCandidates = candidates.filter(p => p.name.includes("Farm Fresh"));
  console.log("Eggs in candidates:", eggsInCandidates.map(e => e.name));
  
}
run().catch(console.error);
