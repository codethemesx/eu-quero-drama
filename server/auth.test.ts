import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
  promoteUserToAdmin: vi.fn(),
  getAllDramas: vi.fn().mockResolvedValue([]),
  getDramaById: vi.fn(),
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn(),
  getAllSettings: vi.fn().mockResolvedValue([]),
  getSalesStats: vi.fn().mockResolvedValue(null),
  getAllOrders: vi.fn().mockResolvedValue([]),
  getUserPurchases: vi.fn().mockResolvedValue([]),
  hasPurchased: vi.fn().mockResolvedValue(false),
  getEpisodesByDramaId: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn(),
  createOrderItems: vi.fn(),
  getOrderById: vi.fn(),
  getOrderWithItems: vi.fn(),
  updateOrderStatus: vi.fn(),
  updateOrderMpData: vi.fn(),
  createPurchases: vi.fn(),
}));

import * as db from "./db";

function createPublicContext(): TrpcContext {
  const cookies: Record<string, string> = {};
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies,
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject registration if email already exists", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 1,
      email: "existing@test.com",
      name: "Existing",
      openId: null,
      passwordHash: "hash",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test",
        email: "existing@test.com",
        password: "password123",
      })
    ).rejects.toThrow("E-mail já cadastrado");
  });

  it("should reject short passwords", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test",
        email: "test@test.com",
        password: "123", // too short
      })
    ).rejects.toThrow();
  });
});

describe("auth.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject login with wrong email", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({ email: "notfound@test.com", password: "password" })
    ).rejects.toThrow("E-mail ou senha incorretos");
  });

  it("should reject login with no password hash", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
      id: 1,
      email: "test@test.com",
      name: "Test",
      openId: null,
      passwordHash: null,
      loginMethod: "oauth",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({ email: "test@test.com", password: "password" })
    ).rejects.toThrow("E-mail ou senha incorretos");
  });
});

describe("auth.logout", () => {
  it("should clear session cookies", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalledTimes(2); // eqd_token + COOKIE_NAME
  });
});

describe("dramas.list", () => {
  it("should return empty list when no dramas", async () => {
    vi.mocked(db.getAllDramas).mockResolvedValueOnce([]);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dramas.list();
    expect(result).toEqual([]);
  });

  it("should return active dramas", async () => {
    const mockDrama = {
      id: 1,
      title: "Test Drama",
      description: "A test drama",
      coverUrl: null,
      price: "29.90",
      discountPrice: null,
      totalEpisodes: 16,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.getAllDramas).mockResolvedValueOnce([mockDrama]);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dramas.list();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Drama");
  });
});

describe("admin access control", () => {
  it("should reject non-admin access to admin stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // No token provided - should throw UNAUTHORIZED
    await expect(caller.admin.stats({})).rejects.toThrow();
  });

  it("should reject non-admin access to admin orders", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.orders({})).rejects.toThrow();
  });
});
