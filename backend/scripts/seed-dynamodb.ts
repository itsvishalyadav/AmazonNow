import fs from "fs";
import path from "path";
import { DynamoDBClient, CreateTableCommand, waitUntilTableExists } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = "AmazonNow-Users";
const ORDERS_TABLE = "AmazonNow-Orders";
const CATALOG_TABLE = "AmazonNow-Catalog";

async function createTableIfNotExists(
  tableName: string,
  keySchema: any[],
  attributeDefinitions: any[]
) {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log(`Creating table ${tableName}...`);
    await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: tableName });
    console.log(`Table ${tableName} is active.`);
  } catch (err: any) {
    if (err.name === "ResourceInUseException") {
      console.log(`Table ${tableName} already exists.`);
    } else {
      throw err;
    }
  }
}

async function seedData() {
  console.log("Seeding DynamoDB...");

  // 1. Create tables
  await createTableIfNotExists(
    USERS_TABLE,
    [{ AttributeName: "id", KeyType: "HASH" }],
    [{ AttributeName: "id", AttributeType: "S" }]
  );

  await createTableIfNotExists(
    ORDERS_TABLE,
    [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "createdAt", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "createdAt", AttributeType: "S" },
    ]
  );

  await createTableIfNotExists(
    CATALOG_TABLE,
    [{ AttributeName: "id", KeyType: "HASH" }],
    [{ AttributeName: "id", AttributeType: "S" }]
  );

  // 2. Load JSON
  const dataDir = path.join(__dirname, "..", "src", "data");
  let users: any = [];
  try {
    users = JSON.parse(fs.readFileSync(path.join(dataDir, "seed-user.json"), "utf-8"));
  } catch (err) {
    console.log("No seed-user.json found. Skipping user seed.");
  }
  
  let orders: any = [];
  try {
    orders = JSON.parse(fs.readFileSync(path.join(dataDir, "seed-orders.json"), "utf-8"));
  } catch (err) {
    console.log("No seed-orders.json found. Skipping orders seed.");
  }

  let catalog: any = [];
  try {
    catalog = JSON.parse(fs.readFileSync(path.join(dataDir, "seed-catalog.json"), "utf-8"));
  } catch (err) {
    console.log("No seed-catalog.json found. Skipping catalog seed.");
  }

  const userArray = Array.isArray(users) ? users : (users ? [users] : []);

  // 3. Batch Write Users
  if (userArray.length > 0) {
    console.log(`Writing ${userArray.length} users...`);
    for (let i = 0; i < userArray.length; i += 25) {
      const batch = userArray.slice(i, i + 25);
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [USERS_TABLE]: batch.map((u: any) => ({
              PutRequest: { Item: u },
            })),
          },
        })
      );
    }
  }

  // 4. Batch Write Orders
  if (orders.length > 0) {
    console.log(`Writing ${orders.length} orders...`);
    for (let i = 0; i < orders.length; i += 25) {
      const batch = orders.slice(i, i + 25);
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [ORDERS_TABLE]: batch.map((o: any) => ({
              PutRequest: { Item: o },
            })),
          },
        })
      );
      await new Promise((res) => setTimeout(res, 200));
    }
  }

  // 5. Batch Write Catalog
  if (catalog.length > 0) {
    console.log(`Writing ${catalog.length} products to catalog...`);
    for (let i = 0; i < catalog.length; i += 25) {
      const batch = catalog.slice(i, i + 25);
      let requestItems: any = {
        [CATALOG_TABLE]: batch.map((p: any) => ({
          PutRequest: { Item: p },
        })),
      };

      while (Object.keys(requestItems).length > 0) {
        const response = await docClient.send(
          new BatchWriteCommand({
            RequestItems: requestItems,
          })
        );

        if (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0) {
          console.log(`Throttled! Retrying ${response.UnprocessedItems[CATALOG_TABLE]?.length || 0} items...`);
          requestItems = response.UnprocessedItems;
          await new Promise((res) => setTimeout(res, 1000));
        } else {
          requestItems = {};
        }
      }
      
      // Small delay to avoid provisioning throttle
      await new Promise((res) => setTimeout(res, 200));
    }
  }

  console.log("✅ DynamoDB seeding complete.");
}

seedData().catch(console.error);
