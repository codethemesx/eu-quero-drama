import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import {
  createDrama,
  createEpisode,
  createOrder,
  createOrderItems,
  createPurchases,
  createUser,
  deleteDrama,
  deleteEpisode,
  getAllDramas,
  getAllOrders,
  getAllSettings,
  getDramaById,
  getEpisodesByDramaId,
  getOrderById,
  getOrderByMpPaymentId,
  getOrderWithItems,
  getPendingOrderByUserId,
  getSalesStats,
  getSetting,
  getUserByEmail,
  getUserById,
  getUserPurchases,
  hasPurchased,
  promoteUserToAdmin,
  setSetting,
  updateDrama,
  updateDramaEpisodeCount,
  updateEpisode,
  updateOrderMpData,
  updateOrderStatus,
} from "./db";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "eu-quero-dramas-secret-key-2024"
);

async function signToken(payload: { userId: number; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});

// ─── Mercado Pago helper (server-side only) ───────────────────────────────────

async function getMpAccessToken(): Promise<string> {
  const token = await getSetting("mp_access_token");
  if (!token) throw new TRPCError({ code: "BAD_REQUEST", message: "Chave do Mercado Pago não configurada" });
  return token;
}

async function createMpPixPayment(params: {
  orderId: number;
  amount: number;
  description: string;
  payerEmail: string;
  externalReference: string;
}) {
  const accessToken = await getMpAccessToken();
  const body = {
    transaction_amount: params.amount,
    description: params.description,
    payment_method_id: "pix",
    payer: { email: params.payerEmail },
    external_reference: params.externalReference,
    date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };

  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": `order-${params.orderId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[MP] Payment creation failed:", err);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar pagamento Pix" });
  }

  const data = await res.json();
  return data;
}

async function getMpPaymentStatus(mpPaymentId: string) {
  const accessToken = await getMpAccessToken();
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao consultar pagamento" });
  return res.json();
}

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      // Try custom JWT first
      const token = ctx.req.cookies?.["eqd_token"];
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          const user = await getUserById(payload.userId);
          return user ?? null;
        }
      }
      return ctx.user ?? null;
    }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });

        const passwordHash = await bcrypt.hash(input.password, 12);
        const isAdmin = input.email === "codethemesx@gmail.com";

        await createUser({
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "email",
          role: isAdmin ? "admin" : "user",
          lastSignedIn: new Date(),
        });

        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const jwtToken = await signToken({ userId: user.id, email: user.email!, role: user.role });
        const cookieOpts = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("eqd_token", jwtToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 * 1000 });

        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });

        // Ensure admin email always has admin role
        if (input.email === "codethemesx@gmail.com" && user.role !== "admin") {
          await promoteUserToAdmin(input.email);
        }

        const jwtToken = await signToken({ userId: user.id, email: user.email!, role: user.role });
        const cookieOpts = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("eqd_token", jwtToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 * 1000 });

        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOpts = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("eqd_token", { ...cookieOpts, maxAge: -1 });
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOpts, maxAge: -1 });
      return { success: true };
    }),
  }),

  // ── Dramas (public) ───────────────────────────────────────────────────────
  dramas: router({
    list: publicProcedure.query(async () => {
      return getAllDramas(true);
    }),

    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const drama = await getDramaById(input.id);
        if (!drama) throw new TRPCError({ code: "NOT_FOUND" });
        const eps = await getEpisodesByDramaId(input.id);
        return { ...drama, episodes: eps.map(e => ({ id: e.id, episodeNumber: e.episodeNumber, title: e.title })) };
      }),
  }),

  // ── Cart & Orders ─────────────────────────────────────────────────────────
  orders: router({
    createOrder: publicProcedure
      .input(z.object({
        dramaIds: z.array(z.number()).min(1),
        token: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Resolve user from cookie token
        let userId: number | null = null;
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (cookieToken) {
          const payload = await verifyToken(cookieToken);
          if (payload) userId = payload.userId;
        }
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para comprar" });

        const user = await getUserById(userId);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Validate dramas and calculate total
        let total = 0;
        const itemsData: Array<{ drama: Awaited<ReturnType<typeof getDramaById>>; price: number }> = [];
        for (const id of input.dramaIds) {
          const drama = await getDramaById(id);
          if (!drama || !drama.isActive) throw new TRPCError({ code: "NOT_FOUND", message: `Novela ${id} não encontrada` });
          const price = drama.discountPrice ? parseFloat(drama.discountPrice) : parseFloat(drama.price);
          total += price;
          itemsData.push({ drama, price });
        }

        // Create order
        const orderId = await createOrder({
          userId,
          status: "pending",
          totalAmount: total.toFixed(2),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        // Create order items
        await createOrderItems(itemsData.map(i => ({
          orderId,
          dramaId: i.drama!.id,
          priceAtPurchase: i.price.toFixed(2),
        })));

        // Create Pix payment via Mercado Pago
        const mpData = await createMpPixPayment({
          orderId,
          amount: total,
          description: `Eu Quero Dramas - ${itemsData.map(i => i.drama!.title).join(", ")}`,
          payerEmail: user.email || "cliente@euquerodramas.com",
          externalReference: `order-${orderId}`,
        });

        // Save MP data to order (never expose access token to client)
        await updateOrderMpData(orderId, {
          mpPaymentId: String(mpData.id),
          pixQrCode: mpData.point_of_interaction?.transaction_data?.qr_code,
          pixQrCodeBase64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
          pixCopyPaste: mpData.point_of_interaction?.transaction_data?.qr_code,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        return {
          orderId,
          total,
          pixQrCode: mpData.point_of_interaction?.transaction_data?.qr_code,
          pixQrCodeBase64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
          pixCopyPaste: mpData.point_of_interaction?.transaction_data?.qr_code,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
      }),

    getStatus: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });

        // If already paid/expired, return cached status
        if (order.status === "paid" || order.status === "expired") {
          return {
            status: order.status,
            orderId: order.id,
            pixQrCode: order.pixQrCode,
            pixQrCodeBase64: order.pixQrCodeBase64,
            pixCopyPaste: order.pixCopyPaste,
            expiresAt: order.expiresAt?.toISOString(),
            paidAt: order.paidAt?.toISOString(),
          };
        }

        // Check expiry
        if (order.expiresAt && new Date() > order.expiresAt) {
          await updateOrderStatus(order.id, "expired");
          return { status: "expired" as const, orderId: order.id };
        }

        // Poll MP for current status
        if (order.mpPaymentId) {
          try {
            const mpStatus = await getMpPaymentStatus(order.mpPaymentId);
            if (mpStatus.status === "approved") {
              await updateOrderStatus(order.id, "paid", { paidAt: new Date() });
              // Create purchases
              const fullOrder = await getOrderWithItems(order.id);
              if (fullOrder?.items) {
                await createPurchases(fullOrder.items.map(item => ({
                  userId: order.userId,
                  dramaId: item.dramaId,
                  orderId: order.id,
                  pricePaid: item.priceAtPurchase,
                })));
              }
              return {
                status: "paid" as const,
                orderId: order.id,
                paidAt: new Date().toISOString(),
              };
            }
          } catch (e) {
            console.error("[MP] Status check error:", e);
          }
        }

        return {
          status: order.status,
          orderId: order.id,
          pixQrCode: order.pixQrCode,
          pixQrCodeBase64: order.pixQrCodeBase64,
          pixCopyPaste: order.pixCopyPaste,
          expiresAt: order.expiresAt?.toISOString(),
        };
      }),

    myOrders: publicProcedure
      .input(z.object({ token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) return [];
        const payload = await verifyToken(cookieToken);
        if (!payload) return [];
        return getUserPurchases(payload.userId);
      }),
  }),

  // ── User area ─────────────────────────────────────────────────────────────
  user: router({
    purchases: publicProcedure
      .input(z.object({ token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED" });
        return getUserPurchases(payload.userId);
      }),

    dramaEpisodes: publicProcedure
      .input(z.object({ dramaId: z.number(), token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED" });

        const owned = await hasPurchased(payload.userId, input.dramaId);
        if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui esta novela" });

        return getEpisodesByDramaId(input.dramaId);
      }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    // Dashboard stats
    stats: publicProcedure
      .input(z.object({ token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getSalesStats();
      }),

    orders: publicProcedure
      .input(z.object({ token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getAllOrders();
      }),

    // Dramas CRUD
    listDramas: publicProcedure
      .input(z.object({ token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getAllDramas(false);
      }),

    createDrama: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        coverUrl: z.string().optional(),
        price: z.string(),
        discountPrice: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createDrama({
          title: input.title,
          description: input.description,
          coverUrl: input.coverUrl,
          price: input.price,
          discountPrice: input.discountPrice || null,
          isActive: input.isActive,
        });
        return { id };
      }),

    updateDrama: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        coverUrl: z.string().optional(),
        price: z.string().optional(),
        discountPrice: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, token, ...data } = input;
        await updateDrama(id, data);
        return { success: true };
      }),

    deleteDrama: publicProcedure
      .input(z.object({ token: z.string().optional(), id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteDrama(input.id);
        return { success: true };
      }),

    // Episodes CRUD
    listEpisodes: publicProcedure
      .input(z.object({ token: z.string().optional(), dramaId: z.number() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getEpisodesByDramaId(input.dramaId);
      }),

    createEpisode: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        dramaId: z.number(),
        episodeNumber: z.number(),
        title: z.string().optional(),
        downloadUrl: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createEpisode({
          dramaId: input.dramaId,
          episodeNumber: input.episodeNumber,
          title: input.title,
          downloadUrl: input.downloadUrl,
        });
        await updateDramaEpisodeCount(input.dramaId);
        return { id };
      }),

    updateEpisode: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        id: z.number(),
        episodeNumber: z.number().optional(),
        title: z.string().optional(),
        downloadUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, token, ...data } = input;
        await updateEpisode(id, data);
        return { success: true };
      }),

    deleteEpisode: publicProcedure
      .input(z.object({ token: z.string().optional(), id: z.number(), dramaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteEpisode(input.id);
        await updateDramaEpisodeCount(input.dramaId);
        return { success: true };
      }),

    // Settings
    getSettings: publicProcedure
      .input(z.object({ token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const whatsappLink = await getSetting("whatsapp_link");
        const hasMpToken = !!(await getSetting("mp_access_token"));
        return { whatsappLink, hasMpToken };
      }),

    saveSettings: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        mpAccessToken: z.string().optional(),
        whatsappLink: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cookieToken = ctx.req.cookies?.["eqd_token"] || input.token;
        if (!cookieToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const payload = await verifyToken(cookieToken);
        if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        if (input.mpAccessToken) await setSetting("mp_access_token", input.mpAccessToken);
        if (input.whatsappLink !== undefined) await setSetting("whatsapp_link", input.whatsappLink);
        return { success: true };
      }),
  }),

  // ── Public settings (non-sensitive) ──────────────────────────────────────
  publicSettings: router({
    whatsappLink: publicProcedure.query(async () => {
      return getSetting("whatsapp_link");
    }),
  }),
});

export type AppRouter = typeof appRouter;
