import "dotenv/config";
import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { closeDb } from "../db";
import { logRequest, logResponse, logError, logWarn, cleanOldLogs } from "./logger";

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

  // ===== MIDDLEWARE =====
  
  // Compression middleware - reduce response size
  app.use(compression());

  // Body parser with size limits
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    const startTime = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    
    logRequest(req.method, req.path, ip);
    
    // Interceptar response para logar
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      logResponse(req.method, req.path, res.statusCode, duration, ip);
      return originalSend.call(this, data);
    };
    
    next();
  });

  // Rate limiting for API endpoints
  // Limit: 1000 requests per 15 minutes per IP
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.ip === "127.0.0.1" || req.ip === "::1";
    },
  });

  // Stricter rate limiting for log ingest endpoint
  // Limit: 10000 requests per minute (for high-volume log collection)
  const logIngestLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10000, // 10000 requests per minute
    message: "Too many log requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.ip === "127.0.0.1" || req.ip === "::1";
    },
  });

  // Apply rate limiting
  app.use("/api/", apiLimiter);
  app.use("/api/trpc/logs.ingest", logIngestLimiter);

  // ===== ROUTES =====

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ===== ERROR HANDLING =====

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const statusCode = err.statusCode || 500;
    
    logError(req.method, req.path, statusCode, err, ip);
    
    res.status(statusCode).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  // ===== SERVER STARTUP =====

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] Compression: enabled`);
    console.log(`[Server] Rate limiting: enabled`);
    console.log(`[Server] Connection pooling: enabled (max 50 concurrent connections)`);
    console.log(`[Server] Request logging: enabled`);
    console.log(`[Server] Logs directory: ./logs`);
  });

  // Clean old logs on startup
  cleanOldLogs(7);

  // ===== GRACEFUL SHUTDOWN =====

  const gracefulShutdown = async (signal: string) => {
    logWarn(`Received ${signal}, shutting down gracefully...`);
    
    server.close(async () => {
      logWarn("HTTP server closed");
      await closeDb();
      logWarn("Database connections closed");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

startServer().catch(console.error);
