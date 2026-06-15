import { initCatalog, all } from "./src/services/catalog.js";

async function main() {
  await initCatalog();
  const items = all();
  console.log("Total items in cache:", items.length);

  const keywords = ["pillow", "adapter", "lock", "iphone", "galaxy", "mixer", "kettle", "toaster", "echo", "fire", "sony"];
  
  for (const kw of keywords) {
    const results = items.filter(p => p.name.toLowerCase().includes(kw.toLowerCase()));
    console.log(`\nSearch for "${kw}":`);
    results.forEach(p => console.log(` - [${p.id}] ${p.name} (Cat: ${p.category})`));
  }
}

main().catch(console.error);
