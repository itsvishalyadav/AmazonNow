import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRating() {
  const base = Math.random() > 0.2 ? 4.0 : 3.5;
  const rating = base + Math.random() * 0.9;
  return Math.round(rating * 10) / 10;
}

async function migrate() {
  console.log("Scanning AmazonNow-Catalog...");
  const { Items } = await docClient.send(new ScanCommand({ TableName: "AmazonNow-Catalog" }));
  
  if (!Items) {
    console.log("No items found");
    return;
  }
  
  console.log(`Found ${Items.length} items. Migrating...`);
  
  let modifiedCount = 0;
  for (const product of Items) {
    let needsUpdate = false;
    
    if (!product.rating) {
      product.rating = randomRating();
      product.reviewCount = randomInt(15, 12000);
      product.isPrime = Math.random() > 0.15;
      
      const r = Math.random();
      if (r < 0.4) product.deliveryTime = "10 mins";
      else if (r < 0.7) product.deliveryTime = "15 mins";
      else if (r < 0.9) product.deliveryTime = "Same Day";
      else product.deliveryTime = "Next Day";
      needsUpdate = true;
    }
    
    if (!product.imageUrl || product.imageUrl.includes("source.unsplash.com")) {
      const encodedName = encodeURIComponent(product.name.split(" ").join(""));
      product.imageUrl = `https://picsum.photos/seed/${encodedName}/200/200`;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await docClient.send(new PutCommand({
        TableName: "AmazonNow-Catalog",
        Item: product
      }));
      modifiedCount++;
      if (modifiedCount % 50 === 0) console.log(`Updated ${modifiedCount}...`);
    }
  }
  
  console.log(`Done! Migrated ${modifiedCount} items in DynamoDB.`);
}

migrate().catch(console.error);
