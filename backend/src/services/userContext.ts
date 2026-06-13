// backend/src/services/userContext.ts
// Phase 4: Loads user profile and recent order history from seed data.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { getById as getProduct } from "./catalog.js";
import type { User, Order, Product } from "../types/index.js";

const dataDir = path.join(__dirname, "..", "data");

// ── Loaders ───────────────────────────────────────────────────────────────────
function loadUsers(): User[] {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(dataDir, "seed-user.json"), "utf-8"));
    // seed-user.json may be a single user object OR an array
    return Array.isArray(raw) ? raw : [raw];
  } catch {
    return [];
  }
}

function loadOrders(): Order[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, "seed-orders.json"), "utf-8"));
  } catch {
    return [];
  }
}

// Singleton caches
let _users: User[] | null = null;
let _orders: Order[] | null = null;

function users(): User[] {
  if (!_users) _users = loadUsers();
  return _users;
}

function orders(): Order[] {
  return loadOrders();
}

export function addOrderToContext(order: Order): void {
  if (!_orders) _orders = loadOrders();
  _orders.push(order);
}

// ── Public: getUserContext ────────────────────────────────────────────────────
export interface UserContext {
  user: User;
  recentOrders: Order[];            // last 5
  recentProducts: Product[];        // distinct products from recent orders
  learnedPrefs: { avoid: string[]; prefer: string[] };
}

export function getUserContext(userId: string): UserContext {
  const userList = users();
  const user =
    userList.find((u) => u.id === userId) ??
    userList[0] ??                          // fallback to demo user
    {
      id: userId,
      name: "Guest",
      household: { size: 2, dietary: [], budgetSensitivity: "med" as const },
      defaultBudget: 500,
      learnedPrefs: { avoid: [], prefer: [] },
    };

  const allOrders = orders();
  const userOrders = allOrders
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentOrders = userOrders.slice(0, 5);

  // Distinct products from recent orders
  const productIdSet = new Set<string>();
  recentOrders.forEach((o) => o.items.forEach((i) => productIdSet.add(i.productId)));
  const recentProducts = [...productIdSet]
    .map((id) => getProduct(id))
    .filter((p): p is Product => p !== undefined);

  return {
    user,
    recentOrders,
    recentProducts,
    learnedPrefs: user.learnedPrefs ?? { avoid: [], prefer: [] },
  };
}

// ── Update learnedPrefs (Phase 10: F9 learn-from-edits) ──────────────────────
export function updateLearnedPrefs(
  userId: string,
  update: { avoided?: string[]; preferred?: string[] }
): void {
  const userList = users();
  const user = userList.find((u) => u.id === userId);
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
      // Remove from prefer if it's there
      const prefIdx = prefer.indexOf(label);
      if (prefIdx > -1) prefer.splice(prefIdx, 1);
      
      // Add to avoid
      if (!avoid.includes(label)) avoid.push(label);
    });
  }
  if (update.preferred) {
    update.preferred.forEach((id) => {
      const label = getLabel(id);
      // Remove from avoid if it's there
      const avoidIdx = avoid.indexOf(label);
      if (avoidIdx > -1) avoid.splice(avoidIdx, 1);
      
      // Add to prefer
      if (!prefer.includes(label)) prefer.push(label);
    });
  }

  // Cap at 20 items each (keep most recent)
  if (avoid.length > 20) user.learnedPrefs.avoid = avoid.slice(-20);
  if (prefer.length > 20) user.learnedPrefs.prefer = prefer.slice(-20);

  // Persist back to seed-user.json (single-user prototype)
  try {
    fs.writeFileSync(path.join(dataDir, "seed-user.json"), JSON.stringify(userList.length === 1 ? userList[0] : userList, null, 2));
  } catch (err) {
    console.error("[userContext] Failed to persist learnedPrefs:", err);
  }
}
