import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Dramas (Novelas) ─────────────────────────────────────────────────────────
export const dramas = mysqlTable("dramas", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal("discountPrice", { precision: 10, scale: 2 }),
  totalEpisodes: int("totalEpisodes").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Drama = typeof dramas.$inferSelect;
export type InsertDrama = typeof dramas.$inferInsert;

// ─── Episodes ─────────────────────────────────────────────────────────────────
export const episodes = mysqlTable("episodes", {
  id: int("id").autoincrement().primaryKey(),
  dramaId: int("dramaId")
    .notNull()
    .references(() => dramas.id, { onDelete: "cascade" }),
  episodeNumber: int("episodeNumber").notNull(),
  title: varchar("title", { length: 255 }),
  downloadUrl: text("downloadUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = typeof episodes.$inferInsert;

// ─── Orders (Pedidos / Carrinho) ──────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  status: mysqlEnum("status", ["pending", "paid", "expired", "cancelled"])
    .default("pending")
    .notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  // Mercado Pago fields
  mpPaymentId: varchar("mpPaymentId", { length: 255 }),
  mpPreferenceId: varchar("mpPreferenceId", { length: 255 }),
  pixQrCode: text("pixQrCode"),
  pixQrCodeBase64: text("pixQrCodeBase64"),
  pixCopyPaste: text("pixCopyPaste"),
  expiresAt: timestamp("expiresAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  dramaId: int("dramaId")
    .notNull()
    .references(() => dramas.id),
  priceAtPurchase: decimal("priceAtPurchase", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Purchases (Compras Confirmadas) ─────────────────────────────────────────
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  dramaId: int("dramaId")
    .notNull()
    .references(() => dramas.id),
  orderId: int("orderId")
    .notNull()
    .references(() => orders.id),
  pricePaid: decimal("pricePaid", { precision: 10, scale: 2 }).notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

// ─── System Settings ──────────────────────────────────────
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
