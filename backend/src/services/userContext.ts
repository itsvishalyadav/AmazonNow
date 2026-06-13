import { getById as getProduct } from "./catalog.js";
import type { User, Order, Product } from "../types/index.js";
import { getUser, updateLearnedPrefs as dynamoUpdateLearnedPrefs, getOrders, getAllOrders } from "./dynamodb.js";

// ── Public: getUserContext ────────────────────────────────────────────────────
export interface UserContext {
  user: User;
  recentOrders: Order[];            // last 5
  recentProducts: Product[];        // distinct products from recent orders
  learnedPrefs: { avoid: string[]; prefer: string[] };
}

export async function getUserContext(userId: string): Promise<UserContext> {
  const dbUser = await getUser(userId);
  
  const user: User = dbUser ?? {
    id: userId,
    name: "Guest",
    household: { size: 2, dietary: [], budgetSensitivity: "med" },
    defaultBudget: 500,
    learnedPrefs: { avoid: [], prefer: [] },
  };

  const userOrders = await getOrders(userId, 5); // gets top 5 descending

  // Distinct products from recent orders
  const productIdSet = new Set<string>();
  userOrders.forEach((o) => o.items.forEach((i) => productIdSet.add(i.productId)));
  const recentProducts = [...productIdSet]
    .map((id) => getProduct(id))
    .filter((p): p is Product => p !== undefined);

  return {
    user,
    recentOrders: userOrders,
    recentProducts,
    learnedPrefs: user.learnedPrefs ?? { avoid: [], prefer: [] },
  };
}

export async function getUserContextAllOrders(userId: string): Promise<UserContext & { allOrders: Order[] }> {
  const context = await getUserContext(userId);
  const allOrders = await getAllOrders(userId);
  return { ...context, allOrders };
}

// ── Update learnedPrefs (Phase 10: F9 learn-from-edits) ──────────────────────
export async function updateLearnedPrefs(
  userId: string,
  update: { avoided?: string[]; preferred?: string[] }
): Promise<void> {
  const user = await getUser(userId);
  if (!user) return;

  if (!user.learnedPrefs) user.learnedPrefs = { avoid: [], prefer: [] };
  const { avoid, prefer } = user.learnedPrefs;

  const getLabel = (idOrName: string) => {
    const product = getProduct(idOrName);
    return product ? product.name : idOrName;
  };

  if (update.avoided) {
    update.avoided.forEach((id) => {
      const label = getLabel(id);
      const prefIdx = prefer.indexOf(label);
      if (prefIdx > -1) prefer.splice(prefIdx, 1);
      if (!avoid.includes(label)) avoid.push(label);
    });
  }
  if (update.preferred) {
    update.preferred.forEach((id) => {
      const label = getLabel(id);
      const avoidIdx = avoid.indexOf(label);
      if (avoidIdx > -1) avoid.splice(avoidIdx, 1);
      if (!prefer.includes(label)) prefer.push(label);
    });
  }

  if (avoid.length > 20) user.learnedPrefs.avoid = avoid.slice(-20);
  if (prefer.length > 20) user.learnedPrefs.prefer = prefer.slice(-20);

  // Persist back to DynamoDB
  await dynamoUpdateLearnedPrefs(userId, user.learnedPrefs.avoid, user.learnedPrefs.prefer);
}
