import { eq, gte, lte, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, servers, logs, logSources, logFilters, apiKeys, logStatistics, InsertServer, InsertLog, InsertLogSource, InsertLogFilter, InsertApiKey, InsertLogStatistic } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Server queries
 */
export async function createServer(server: InsertServer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(servers).values(server);
  return result;
}

export async function getServerById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllServers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(servers);
}

/**
 * Validate if a request IP is allowed for a server
 * If server has ipAddress defined, only that IP is allowed
 * If server has no ipAddress, any IP is allowed
 * If server doesn't exist, allow (for testing/dynamic servers)
 */
export async function validateServerIP(serverId: number, requestIP: string): Promise<boolean> {
  const server = await getServerById(serverId);
  if (!server) return true; // Allow if server doesn't exist (for testing)
  
  // If no IP is configured, accept any IP
  if (!server.ipAddress) return true;
  
  // If IP is configured, only accept that IP
  return server.ipAddress === requestIP;
}

/**
 * Log queries
 */
export async function createLog(log: InsertLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(logs).values(log);
  return result;
}

export async function getLogsByServerId(serverId: number, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(logs).where(eq(logs.serverId, serverId)).limit(limit).offset(offset);
}

export async function searchLogs(filters: {
  serverId?: number;
  level?: string;
  source?: string;
  startTime?: number;
  endTime?: number;
  searchText?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(logs);
  const conditions = [];
  
  if (filters.serverId) conditions.push(eq(logs.serverId, filters.serverId));
  if (filters.level) conditions.push(eq(logs.level, filters.level as any));
  if (filters.source) conditions.push(eq(logs.source, filters.source));
  if (filters.startTime) conditions.push(gte(logs.timestamp, filters.startTime));
  if (filters.endTime) conditions.push(lte(logs.timestamp, filters.endTime));
  
  // Note: Full-text search would require additional setup; this is basic filtering
  
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  
  return await query.limit(limit).offset(offset);
}

/**
 * Log Source queries
 */
export async function createLogSource(source: InsertLogSource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(logSources).values(source);
  return result;
}

export async function getLogSourcesByServerId(serverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(logSources).where(eq(logSources.serverId, serverId));
}

/**
 * Log Filter queries
 */
export async function createLogFilter(filter: InsertLogFilter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(logFilters).values(filter);
  return result;
}

export async function getLogFiltersByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(logFilters).where(eq(logFilters.userId, userId));
}

// TODO: add feature queries here as your schema grows.

/**
 * API Key queries
 */
export async function createApiKey(apiKey: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(apiKeys).values(apiKey);
  // Return the created API key
  const result = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey.key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getApiKeyByKey(key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getApiKeysByServerId(serverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(apiKeys).where(eq(apiKeys.serverId, serverId));
}

export async function updateApiKeyLastUsed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(apiKeys).set({ lastUsedAt: Math.floor(Date.now() / 1000) }).where(eq(apiKeys.id, id));
}

/**
 * Log Statistics queries
 */
export async function getOrCreateLogStatistic(serverId: number, date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(logStatistics)
    .where(and(eq(logStatistics.serverId, serverId), eq(logStatistics.date, date)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  await db.insert(logStatistics).values({
    serverId,
    date,
    totalLogs: 0,
    debugCount: 0,
    infoCount: 0,
    warningCount: 0,
    errorCount: 0,
    criticalCount: 0,
  });
  
  const created = await db.select().from(logStatistics)
    .where(and(eq(logStatistics.serverId, serverId), eq(logStatistics.date, date)))
    .limit(1);
  
  return created[0];
}

export async function incrementLogStatistic(serverId: number, date: string, level: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const stat = await getOrCreateLogStatistic(serverId, date);
  
  const updates: Record<string, any> = {
    totalLogs: (stat.totalLogs || 0) + 1,
  };
  
  switch (level) {
    case 'debug':
      updates.debugCount = (stat.debugCount || 0) + 1;
      break;
    case 'info':
      updates.infoCount = (stat.infoCount || 0) + 1;
      break;
    case 'warning':
      updates.warningCount = (stat.warningCount || 0) + 1;
      break;
    case 'error':
      updates.errorCount = (stat.errorCount || 0) + 1;
      break;
    case 'critical':
      updates.criticalCount = (stat.criticalCount || 0) + 1;
      break;
  }
  
  return await db.update(logStatistics)
    .set(updates)
    .where(and(eq(logStatistics.serverId, serverId), eq(logStatistics.date, date)));
}

export async function getLogStatisticsByServerId(serverId: number, days: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  return await db.select().from(logStatistics)
    .where(and(
      eq(logStatistics.serverId, serverId),
      gte(logStatistics.date, startDateStr)
    ));
}
