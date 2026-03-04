import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Drama,
  Episode,
  InsertDrama,
  InsertEpisode,
  InsertOrder,
  InsertOrderItem,
  InsertPurchase,
  InsertUser,
  Order,
  dramas,
  episodes,
  orderItems,
  orders,
  purchases,
  systemSettings,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId ?? undefined };
  const updateSet: Record<string, unknown> = {};
  const fields = ["name", "email", "loginMethod", "passwordHash", "role"] as const;
  for (const f of fields) {
    if (user[f] !== undefined) {
      (values as Record<string, unknown>)[f] = user[f];
      updateSet[f] = user[f];
    }
  }
  values.lastSignedIn = new Date();
  updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return r[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return r[0];
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(users).values(user);
  return r[0];
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function promoteUserToAdmin(email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Dramas ───────────────────────────────────────────────────────────────────

export async function getAllDramas(onlyActive = false) {
  const db = await getDb();
  if (!db) return [];
  if (onlyActive) {
    return db.select().from(dramas).where(eq(dramas.isActive, true)).orderBy(desc(dramas.createdAt));
  }
  return db.select().from(dramas).orderBy(desc(dramas.createdAt));
}

export async function getDramaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(dramas).where(eq(dramas.id, id)).limit(1);
  return r[0];
}

export async function createDrama(drama: InsertDrama): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(dramas).values(drama);
  return (r as unknown as { insertId: number }).insertId;
}

export async function updateDrama(id: number, data: Partial<InsertDrama>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(dramas).set(data).where(eq(dramas.id, id));
}

export async function deleteDrama(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(dramas).where(eq(dramas.id, id));
}

// ─── Episodes ─────────────────────────────────────────────────────────────────

export async function getEpisodesByDramaId(dramaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(episodes)
    .where(eq(episodes.dramaId, dramaId))
    .orderBy(episodes.episodeNumber);
}

export async function createEpisode(episode: InsertEpisode): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(episodes).values(episode);
  return (r as unknown as { insertId: number }).insertId;
}

export async function updateEpisode(id: number, data: Partial<InsertEpisode>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(episodes).set(data).where(eq(episodes.id, id));
}

export async function deleteEpisode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(episodes).where(eq(episodes.id, id));
}

export async function updateDramaEpisodeCount(dramaId: number) {
  const db = await getDb();
  if (!db) return;
  const r = await db
    .select({ count: sql<number>`count(*)` })
    .from(episodes)
    .where(eq(episodes.dramaId, dramaId));
  const count = r[0]?.count ?? 0;
  await db.update(dramas).set({ totalEpisodes: count }).where(eq(dramas.id, dramaId));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(order: InsertOrder): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  // Insert and get the last inserted ID
  const result = await db.insert(orders).values(order);
  
  // Get the inserted order to return its ID
  const inserted = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, order.userId))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  
  if (!inserted[0]) throw new Error("Failed to create order");
  return inserted[0].id;
}

export async function createOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Ensure all items have valid orderId (required field)
  const validItems = items.map(item => ({
    orderId: item.orderId as number,
    dramaId: item.dramaId as number,
    priceAtPurchase: item.priceAtPurchase as string,
  }));
  await db.insert(orderItems).values(validItems);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return r[0];
}

export async function getOrderWithItems(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const order = await getOrderById(orderId);
  if (!order) return undefined;
  const items = await db
    .select({
      id: orderItems.id,
      dramaId: orderItems.dramaId,
      priceAtPurchase: orderItems.priceAtPurchase,
      drama: dramas,
    })
    .from(orderItems)
    .leftJoin(dramas, eq(orderItems.dramaId, dramas.id))
    .where(eq(orderItems.orderId, orderId));
  return { ...order, items };
}

export async function getPendingOrderByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, "pending")))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  return r[0];
}

export async function updateOrderStatus(
  id: number,
  status: Order["status"],
  extra?: Partial<InsertOrder>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(orders)
    .set({ status, ...extra })
    .where(eq(orders.id, id));
}

export async function updateOrderMpData(
  id: number,
  data: {
    mpPaymentId?: string;
    mpPreferenceId?: string;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
    pixCopyPaste?: string;
    expiresAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

export async function getOrderByMpPaymentId(mpPaymentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db
    .select()
    .from(orders)
    .where(eq(orders.mpPaymentId, mpPaymentId))
    .limit(1);
  return r[0];
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      order: orders,
      user: { id: users.id, name: users.name, email: users.email },
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export async function createPurchases(items: InsertPurchase[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(purchases).values(items);
}

export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      purchase: purchases,
      drama: dramas,
    })
    .from(purchases)
    .leftJoin(dramas, eq(purchases.dramaId, dramas.id))
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.purchasedAt));
}

export async function hasPurchased(userId: number, dramaId: number) {
  const db = await getDb();
  if (!db) return false;
  const r = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.dramaId, dramaId)))
    .limit(1);
  return r.length > 0;
}

// ─── System Settings ──────────────────────────────────────────────────────────

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const r = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return r[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .insert(systemSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemSettings);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getSalesStats() {
  const db = await getDb();
  if (!db) return null;

  const totalRevenue = await db
    .select({ total: sql<string>`COALESCE(SUM(totalAmount), 0)` })
    .from(orders)
    .where(eq(orders.status, "paid"));

  const totalOrders = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders);

  const paidOrders = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "paid"));

  const pendingOrders = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "pending"));

  const totalUsers = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  const recentSales = await db
    .select({
      date: sql<string>`DATE(paidAt)`,
      revenue: sql<string>`SUM(totalAmount)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.status, "paid"))
    .groupBy(sql`DATE(paidAt)`)
    .orderBy(sql`DATE(paidAt) DESC`)
    .limit(30);

  const topDramas = await db
    .select({
      dramaId: orderItems.dramaId,
      title: dramas.title,
      count: sql<number>`count(*)`,
      revenue: sql<string>`SUM(priceAtPurchase)`,
    })
    .from(orderItems)
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(dramas, eq(orderItems.dramaId, dramas.id))
    .where(eq(orders.status, "paid"))
    .groupBy(orderItems.dramaId, dramas.title)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  return {
    totalRevenue: parseFloat(totalRevenue[0]?.total ?? "0"),
    totalOrders: totalOrders[0]?.count ?? 0,
    paidOrders: paidOrders[0]?.count ?? 0,
    pendingOrders: pendingOrders[0]?.count ?? 0,
    conversionRate:
      (totalOrders[0]?.count ?? 0) > 0
        ? ((paidOrders[0]?.count ?? 0) / (totalOrders[0]?.count ?? 1)) * 100
        : 0,
    totalUsers: totalUsers[0]?.count ?? 0,
    recentSales: recentSales.reverse(),
    topDramas,
  };
}
