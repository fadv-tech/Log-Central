import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  createLog, searchLogs, listLogsByServer, createServer, listServers, getServerById,
  createApiKey, getApiKeyByKey, listApiKeysByServer, 
  getOrCreateLogStatistic, getStatisticsForLastDays, createLogSource, listLogSourcesByServer,
  validateServerIP
} from "./db";
import crypto from "crypto";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  servers: router({
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          name: String(obj.name || ''),
          hostname: String(obj.hostname || ''),
          type: String(obj.type || 'linux'),
          description: obj.description ? String(obj.description) : undefined,
        };
      })
      .mutation(async ({ input }) => {
        return await createServer({
          name: input.name,
          hostname: input.hostname,
          type: input.type,
          description: input.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),

    list: publicProcedure.query(async () => {
      return await listServers();
    }),

    delete: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        return { id: Number((val as any).id) };
      })
      .mutation(async ({ input }) => {
        // Implement delete logic
        return { success: true };
      }),
  }),

  logs: router({
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: Number(obj.serverId || 0),
          level: String(obj.level || 'info'),
          message: String(obj.message || ''),
          source: String(obj.source || 'unknown'),
          metadata: obj.metadata ? JSON.stringify(obj.metadata) : undefined,
        };
      })
      .mutation(async ({ input }) => {
        return await createLog({
          serverId: input.serverId,
          level: input.level,
          message: input.message,
          source: input.source,
          metadata: input.metadata,
          createdAt: new Date(),
        });
      }),

    search: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) return {};
        const obj = val as Record<string, unknown>;
        return {
          serverId: obj.serverId ? Number(obj.serverId) : undefined,
          level: obj.level ? String(obj.level) : undefined,
          source: obj.source ? String(obj.source) : undefined,
          limit: obj.limit ? Number(obj.limit) : 100,
          offset: obj.offset ? Number(obj.offset) : 0,
        };
      })
      .query(async ({ input }) => {
        return await searchLogs(input);
      }),

    getByServerId: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        return { serverId: Number((val as any).serverId) };
      })
      .query(async ({ input }) => {
        return await listLogsByServer(input.serverId);
      }),
  }),

  apiKeys: router({
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: Number(obj.serverId || 0),
          name: String(obj.name || ''),
        };
      })
      .mutation(async ({ input }) => {
        const key = crypto.randomBytes(32).toString('hex');
        return await createApiKey({
          serverId: input.serverId,
          name: input.name,
          key: key,
          createdAt: new Date(),
          lastUsedAt: null,
        });
      }),

    list: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        return { serverId: Number((val as any).serverId) };
      })
      .query(async ({ input }) => {
        return await listApiKeysByServer(input.serverId);
      }),

    delete: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        return { id: Number((val as any).id) };
      })
      .mutation(async ({ input }) => {
        // Implement delete logic
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
