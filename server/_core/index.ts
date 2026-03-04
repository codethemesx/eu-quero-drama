import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Webhook para Mercado Pago
  app.post("/api/webhook/mercadopago", async (req, res) => {
    try {
      const { data } = req.body;
      if (data?.id) {
        const { getOrderByMpPaymentId, updateOrderStatus, getOrderWithItems, createPurchases } = await import("../db");
        const order = await getOrderByMpPaymentId(String(data.id));
        if (order && order.status === "pending") {
          await updateOrderStatus(order.id, "paid", { paidAt: new Date() });
          const fullOrder = await getOrderWithItems(order.id);
          if (fullOrder?.items) {
            await createPurchases(fullOrder.items.map(item => ({
              userId: order.userId,
              dramaId: item.dramaId,
              orderId: order.id,
              pricePaid: item.priceAtPurchase,
            })));
          }
          console.log(`[Webhook MP] Pedido ${order.id} confirmado automaticamente`);
        }
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Webhook MP] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
