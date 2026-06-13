import "dotenv/config";
import { putOrder } from "../src/services/dynamodb.js";
import { initCatalog, all } from "../src/services/catalog.js";
import { randomUUID } from "crypto";

async function run() {
  await initCatalog();
  const catalog = all();
  
  if (catalog.length === 0) {
    console.error("Catalog is empty. Cannot seed orders.");
    return;
  }

  // Pick some recurring products
  const milk = catalog.find(p => p.name.toLowerCase().includes("milk")) || catalog[0];
  const bread = catalog.find(p => p.name.toLowerCase().includes("bread")) || catalog[1];
  const eggs = catalog.find(p => p.name.toLowerCase().includes("egg")) || catalog[2];
  const coffee = catalog.find(p => p.name.toLowerCase().includes("coffee")) || catalog[3];
  const rice = catalog.find(p => p.name.toLowerCase().includes("rice")) || catalog[4];

  console.log("Selected recurring products:");
  [milk, bread, eggs, coffee, rice].forEach(p => console.log(`- ${p?.name}`));

  const userId = "user-demo-01";
  const numOrders = 15;
  const today = new Date();
  const pastOrders = [];

  for (let i = 0; i < numOrders; i++) {
    // Distribute randomly over the last 120 days (approx 4 months)
    const daysAgo = Math.floor(Math.random() * 120) + 1;
    const orderDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Pick 2-4 random items from our recurring pool
    const itemsPool = [milk, bread, eggs, coffee, rice].filter(Boolean);
    const shuffled = itemsPool.sort(() => 0.5 - Math.random());
    const numItems = Math.floor(Math.random() * 3) + 2; // 2 to 4 items
    const selectedItems = shuffled.slice(0, numItems);

    const order = {
      id: `ord-seed-${randomUUID().slice(0, 8)}`,
      userId,
      items: selectedItems.map(p => ({
        productId: p.id,
        qty: Math.floor(Math.random() * 2) + 1 // 1 or 2 qty
      })),
      createdAt: orderDate.toISOString(),
    };
    
    pastOrders.push(order);
  }

  // Sort by date ascending (oldest first)
  pastOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  console.log(`Seeding ${pastOrders.length} orders to DynamoDB...`);
  
  for (const order of pastOrders) {
    await putOrder(order);
    console.log(`Saved order ${order.id} on ${order.createdAt.split('T')[0]}`);
  }

  console.log("✅ Past orders seeded successfully!");
}

run().catch(console.error);
