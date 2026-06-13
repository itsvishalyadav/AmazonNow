import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RAW_PRODUCTS } from "./raw-products.js";
import { embedWithBedrock } from "../src/services/bedrock.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Generating catalog with Amazon Bedrock embeddings...");
  console.log(`Processing ${RAW_PRODUCTS.length} products. This will take a moment.`);

  const catalog: any[] = [];
  
  for (let i = 0; i < RAW_PRODUCTS.length; i++) {
    const p = RAW_PRODUCTS[i];
    
    // We pad the product ID just like the original script to stay consistent
    const id = `prod-${(i + 1).toString().padStart(4, "0")}`;
    
    // Build a semantic string to embed
    const textToEmbed = `${p.name} ${p.category} ${p.subcategory} ${p.tags.join(" ")} ${p.dietary.join(" ")}`;
    
    try {
      const embedding = await embedWithBedrock(textToEmbed);
      
      catalog.push({
        id,
        ...p,
        embedding,
      });

      if (true) {
        console.log(`Processed ${i + 1}/${RAW_PRODUCTS.length} products`);
      }
    } catch (error) {
      console.error(`Failed to embed product ${id}: ${p.name}`, error);
      process.exit(1);
    }
  }

  const outPath = path.join(__dirname, "..", "src", "data", "seed-catalog.json");
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2));
  
  console.log(`✅ Success! Generated ${catalog.length} products with Bedrock embeddings.`);
  console.log(`Saved to ${outPath}`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
