import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" } as any,
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext; } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" } as any,
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("logs router", () => {
  describe("logs.ingest", () => {
    it("should reject logs from restricted IP", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.logs.ingest({
          serverId: 1,
          clientIP: "192.168.1.100",
          timestamp: Date.now(),
          level: "info",
          source: "syslog",
          message: "Test log message from wrong IP",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("is not allowed for this server");
      }
    });

    it("should fail without serverId or apiKey", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.logs.ingest({
          serverId: undefined as any,
          clientIP: "127.0.0.1",
          timestamp: Date.now(),
          level: "info",
          source: "syslog",
          message: "Test log message",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("serverId or valid apiKey is required");
      }
    });

    it("should accept logs from allowed IP", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Server 1 has no IP restriction, so any IP should work
      const result = await caller.logs.ingest({
        serverId: 1,
        clientIP: "192.168.1.1",
        message: "Test log message from any IP",
      });

      expect(result).toEqual({ success: true });
    });

    it("should reject invalid API key", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.logs.ingest({
          apiKey: "invalid-key",
          clientIP: "127.0.0.1",
          message: "Test log with invalid API key",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Invalid or inactive API key");
      }
    });
  });

  describe("logs.search", () => {
    it("should accept search parameters", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.logs.search({
        serverId: 1,
        level: "error",
        limit: 50,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("logs.listByServer", () => {
    it("should list logs for a specific server", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.logs.listByServer({
        serverId: 1,
        limit: 100,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("servers router", () => {
  describe("servers.create", () => {
    it("should create a server", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.servers.create({
        name: "Test Server",
        hostname: "test.example.com",
        ipAddress: "192.168.1.1",
        serverType: "linux",
        description: "A test server",
      });

      expect(result).toBeDefined();
    });
  });

  describe("servers.list", () => {
    it("should list all servers", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.servers.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("servers.getById", () => {
    it("should get a server by id", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.servers.getById({ id: 1 });

      // Result can be undefined if server doesn't exist
      expect(result === undefined || typeof result === 'object').toBe(true);
    });
  });
});
