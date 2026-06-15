import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
import type { User, Order } from "../types/index.js";

dotenv.config();

const REGION = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region: REGION });
export const docClient = DynamoDBDocumentClient.from(client);

export const USERS_TABLE = "AmazonNow-Users";
export const ORDERS_TABLE = "AmazonNow-Orders";
export const CATALOG_TABLE = "AmazonNow-Catalog";

// ── Users ───────────────────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<User | null> {
  try {
    const res = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: userId },
      })
    );
    return (res.Item as User) || null;
  } catch (err) {
    console.error(`[dynamodb] Failed to get user ${userId}:`, err);
    return null;
  }
}

export async function putUser(user: User): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: user,
      })
    );
  } catch (err) {
    console.error(`[dynamodb] Failed to put user ${user.id}:`, err);
  }
}

export async function updateLearnedPrefs(
  userId: string,
  avoid: string[],
  prefer: string[]
): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "SET learnedPrefs.avoid = :avoid, learnedPrefs.prefer = :prefer",
        ExpressionAttributeValues: {
          ":avoid": avoid,
          ":prefer": prefer,
        },
      })
    );
  } catch (err) {
    console.error(`[dynamodb] Failed to update learned prefs for ${userId}:`, err);
  }
}

// ── Orders ──────────────────────────────────────────────────────────────────────

export async function getOrders(userId: string, limit: number = 5): Promise<Order[]> {
  try {
    const res = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        ScanIndexForward: false, // Descending (newest first)
        Limit: limit,
      })
    );
    return (res.Items as Order[]) || [];
  } catch (err) {
    console.error(`[dynamodb] Failed to get orders for ${userId}:`, err);
    return [];
  }
}

export async function getAllOrders(userId: string): Promise<Order[]> {
  // Uses pagination if needed, but for prototype we just grab up to 100
  try {
    const res = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        ScanIndexForward: false, // Descending
        Limit: 100, 
      })
    );
    return (res.Items as Order[]) || [];
  } catch (err) {
    console.error(`[dynamodb] Failed to get all orders for ${userId}:`, err);
    return [];
  }
}

export async function putOrder(order: Order): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: ORDERS_TABLE,
        Item: order,
      })
    );
  } catch (err) {
    console.error(`[dynamodb] Failed to put order ${order.id}:`, err);
  }
}

// ── Catalog ──────────────────────────────────────────────────────────────────────

import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { Product } from "../types/index.js";

export async function fetchFullCatalogFromDynamo(): Promise<Product[]> {
  try {
    let allProducts: Product[] = [];
    let lastKey: any = undefined;

    do {
      const res = await docClient.send(
        new ScanCommand({
          TableName: CATALOG_TABLE,
          ExclusiveStartKey: lastKey,
        })
      );
      if (res.Items) {
        allProducts = allProducts.concat(res.Items as Product[]);
      }
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);

    return allProducts;
  } catch (err) {
    console.error(`[dynamodb] Failed to fetch catalog from DynamoDB:`, err);
    return [];
  }
}
