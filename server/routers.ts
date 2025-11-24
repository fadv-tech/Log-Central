import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  createLog, searchLogs, getLogsByServerId, createServer, getAllServers, getServerById,
  createApiKey, getApiKeyByKey, getApiKeysByServerId, updateApiKeyLastUsed,
  getOrCreateLogStatistic, getLogStatisticsByServerId, createLogSource, getLogSourcesByServerId,
  validateServerIP, getDb
} from "./db";
import { apiKeys } from "../drizzle/schema";

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

  logs: router({
    ingest: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          apiKey: typeof obj.apiKey === 'string' ? obj.apiKey : undefined,
          serverId: typeof obj.serverId === 'number' ? obj.serverId : undefined,
          clientIP: typeof obj.clientIP === 'string' ? obj.clientIP : undefined,
          timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
          level: typeof obj.level === 'string' ? obj.level : 'info',
          source: typeof obj.source === 'string' ? obj.source : 'unknown',
          message: typeof obj.message === 'string' ? obj.message : '',
          metadata: typeof obj.metadata === 'string' ? obj.metadata : undefined,
          tags: typeof obj.tags === 'string' ? obj.tags : undefined,
        };
      })
      .mutation(async ({ input, ctx }) => {
        let serverId = input.serverId;
        
        // Get client IP from input or request headers
        let clientIP = input.clientIP;
        if (!clientIP) {
          const forwarded = ctx.req.headers['x-forwarded-for'];
          clientIP = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 
                     (ctx.req.socket?.remoteAddress || 'unknown');
        }
        
        // If API key is provided, validate it
        if (input.apiKey) {
          const apiKeyRecord = await getApiKeyByKey(input.apiKey);
          if (!apiKeyRecord || !apiKeyRecord.isActive) {
            throw new Error('Invalid or inactive API key');
          }
          serverId = apiKeyRecord.serverId;
          // Update last used timestamp
          await updateApiKeyLastUsed(apiKeyRecord.id);
        }
        
        if (!serverId) throw new Error('serverId or valid apiKey is required');
        
        // Validate IP if server has IP restriction
        const isIPAllowed = await validateServerIP(serverId, clientIP);
        if (!isIPAllowed) {
          throw new Error(`IP ${clientIP} is not allowed for this server`);
        }
        
        await createLog({
          serverId,
          timestamp: input.timestamp,
          level: input.level as any,
          source: input.source,
          message: input.message,
          metadata: input.metadata,
          tags: input.tags,
        });
        
        // Update statistics
        const date = new Date(input.timestamp).toISOString().split('T')[0];
        await getOrCreateLogStatistic(serverId, date);
        
        return { success: true };
      }),

    search: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: typeof obj.serverId === 'number' ? obj.serverId : undefined,
          level: typeof obj.level === 'string' ? obj.level : undefined,
          source: typeof obj.source === 'string' ? obj.source : undefined,
          startTime: typeof obj.startTime === 'number' ? obj.startTime : undefined,
          endTime: typeof obj.endTime === 'number' ? obj.endTime : undefined,
          searchText: typeof obj.searchText === 'string' ? obj.searchText : undefined,
          limit: typeof obj.limit === 'number' ? obj.limit : 100,
          offset: typeof obj.offset === 'number' ? obj.offset : 0,
        };
      })
      .query(async ({ input }) => {
        return await searchLogs(input);
      }),

    listByServer: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: typeof obj.serverId === 'number' ? obj.serverId : 0,
          limit: typeof obj.limit === 'number' ? obj.limit : 100,
          offset: typeof obj.offset === 'number' ? obj.offset : 0,
        };
      })
      .query(async ({ input }) => {
        return await getLogsByServerId(input.serverId, input.limit, input.offset);
      }),

    statistics: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: typeof obj.serverId === 'number' ? obj.serverId : 0,
          days: typeof obj.days === 'number' ? obj.days : 7,
        };
      })
      .query(async ({ input }) => {
        return await getLogStatisticsByServerId(input.serverId, input.days);
      }),
  }),

  servers: router({
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          name: typeof obj.name === 'string' ? obj.name : '',
          hostname: typeof obj.hostname === 'string' ? obj.hostname : undefined,
          ipAddress: typeof obj.ipAddress === 'string' ? obj.ipAddress : undefined,
          serverType: typeof obj.serverType === 'string' ? obj.serverType : 'other',
          description: typeof obj.description === 'string' ? obj.description : undefined,
          location: typeof obj.location === 'string' ? obj.location : undefined,
        };
      })
      .mutation(async ({ input }) => {
        const result = await createServer({
          name: input.name,
          hostname: input.hostname,
          ipAddress: input.ipAddress,
          serverType: input.serverType as any,
          description: input.description,
          location: input.location,
          isActive: 1,
        });
        return result;
      }),

    list: publicProcedure.query(async () => {
      return await getAllServers();
    }),

    getById: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          id: typeof obj.id === 'number' ? obj.id : 0,
        };
      })
      .query(async ({ input }) => {
        return await getServerById(input.id);
      }),
  }),

  apiKeys: router({
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: typeof obj.serverId === 'number' ? obj.serverId : 0,
          name: typeof obj.name === 'string' ? obj.name : '',
        };
      })
      .mutation(async ({ input }) => {
        if (!input.serverId) throw new Error('serverId is required');
        if (!input.name) throw new Error('name is required');
        
        // Generate a secure random API key
        const key = crypto.randomBytes(32).toString('hex');
        
        const result = await createApiKey({
          serverId: input.serverId,
          key,
          name: input.name,
          isActive: 1,
        });
        
        return result;
      }),

    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return await db.select().from(apiKeys);
    }),

    listByServer: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: typeof obj.serverId === 'number' ? obj.serverId : 0,
        };
      })
      .query(async ({ input }) => {
        return await getApiKeysByServerId(input.serverId);
      }),
  }),

  logSources: router({
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: typeof obj.serverId === 'number' ? obj.serverId : 0,
          sourceType: typeof obj.sourceType === 'string' ? obj.sourceType : '',
          sourceConfig: typeof obj.sourceConfig === 'string' ? obj.sourceConfig : undefined,
        };
      })
      .mutation(async ({ input }) => {
        if (!input.serverId) throw new Error('serverId is required');
        if (!input.sourceType) throw new Error('sourceType is required');
        
        const result = await createLogSource({
          serverId: input.serverId,
          sourceType: input.sourceType,
          sourceConfig: input.sourceConfig,
          isEnabled: 1,
        });
        
        return { success: true };
      }),

    listByServer: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          serverId: typeof obj.serverId === 'number' ? obj.serverId : 0,
        };
      })
      .query(async ({ input }) => {
        return await getLogSourcesByServerId(input.serverId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
