import { initCatalog, all } from "./src/services/catalog.js";

async function main() {
  await initCatalog();
  const cat = all();
  cat.filter(p => p.id >= "prod-0320" && p.id <= "prod-0340")
     .sort((a,b) => a.id.localeCompare(b.id))
     .forEach(p => console.log(p.id, p.name));
}

main().catch(console.error);
