import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, servers, logs, logSources, logFilters, apiKeys, logStatistics, InsertServer, InsertLog, InsertLogSource, InsertLogFilter, InsertApiKey, InsertLogStatistic } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Connection pool configuration for handling concurrent requests
const POOL_CONFIG = {
  waitForConnections: true,
  connectionLimit: 50, // Máximo de conexões simultâneas (aumentado para melhor throughput)
  queueLimit: 0, // Sem limite de fila
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
};

// Lazily create the drizzle instance with connection pooling
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL to extract connection details
      const url = new URL(process.env.DATABASE_URL);
      
      // Create connection pool for better concurrency handling
      if (!_pool) {
        _pool = mysql.createPool({
          host: url.hostname,
          user: url.username,
          password: url.password,
          database: url.pathname.slice(1),
          port: url.port ? parseInt(url.port) : 3306,
          ...POOL_CONFIG,
        });
      }

      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Graceful shutdown - close pool connections
export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
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

  const { eq } = await import("drizzle-orm");
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== SERVERS =====
export async function createServer(data: InsertServer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(servers).values(data);
  return result;
}

export async function listServers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(servers);
}

export async function getServerById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const { eq } = await import("drizzle-orm");
  const result = await db.select().from(servers).where(eq(servers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== LOGS =====
export async function createLog(data: InsertLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(logs).values(data);
}

export async function searchLogs(filters: {
  serverId?: number;
  level?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { eq, and, gte, lte, like, or } = await import("drizzle-orm");
  
  const conditions = [];

  if (filters.serverId) {
    conditions.push(eq(logs.serverId, filters.serverId));
  }
  if (filters.level) {
    conditions.push(eq(logs.level, filters.level));
  }
  if (filters.source) {
    conditions.push(eq(logs.source, filters.source));
  }
  if (filters.startDate) {
    conditions.push(gte(logs.timestamp, filters.startDate.getTime()));
  }
  if (filters.endDate) {
    conditions.push(lte(logs.timestamp, filters.endDate.getTime()));
  }
  if (filters.searchText) {
    conditions.push(like(logs.message, `%${filters.searchText}%`));
  }

  let query = db.select().from(logs);

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy((t) => t.timestamp).limit(filters.limit || 100).offset(filters.offset || 0);

  return await query;
}

export async function listLogsByServer(serverId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const { eq } = await import("drizzle-orm");
  return await db
    .select()
    .from(logs)
    .where(eq(logs.serverId, serverId))
    .orderBy((t) => t.timestamp)
    .limit(limit)
    .offset(offset);
}

// ===== LOG SOURCES =====
export async function createLogSource(data: InsertLogSource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(logSources).values(data);
}

export async function listLogSourcesByServer(serverId: number) {
  const db = await getDb();
  if (!db) return [];

  const { eq } = await import("drizzle-orm");
  return await db.select().from(logSources).where(eq(logSources.serverId, serverId));
}

// ===== LOG FILTERS =====
export async function createLogFilter(data: InsertLogFilter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(logFilters).values(data);
}

export async function listLogFilters() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(logFilters);
}

// ===== API KEYS =====
export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(apiKeys).values(data);
}

export async function getApiKeyByKey(key: string) {
  const db = await getDb();
  if (!db) return null;

  const { eq } = await import("drizzle-orm");
  const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listApiKeysByServer(serverId: number) {
  const db = await getDb();
  if (!db) return [];

  const { eq } = await import("drizzle-orm");
  return await db.select().from(apiKeys).where(eq(apiKeys.serverId, serverId));
}

// ===== LOG STATISTICS =====
export async function getOrCreateLogStatistic(serverId: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { eq, and } = await import("drizzle-orm");
  
  const dateStr = date.toISOString().split('T')[0];
  const result = await db
    .select()
    .from(logStatistics)
    .where(and(eq(logStatistics.serverId, serverId), eq(logStatistics.date, dateStr)))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  // Create new statistic
  const newStat: InsertLogStatistic = {
    serverId,
    date: dateStr,
    totalLogs: 0,
    debugCount: 0,
    infoCount: 0,
    warningCount: 0,
    errorCount: 0,
    criticalCount: 0,
  };

  await db.insert(logStatistics).values(newStat);
  return newStat;
}

export async function incrementLogStatistic(serverId: number, date: Date, level: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { eq, and, sql } = await import("drizzle-orm");
  
  const dateStr = date.toISOString().split('T')[0];
  
  const levelColumn = {
    debug: logStatistics.debugCount,
    info: logStatistics.infoCount,
    warning: logStatistics.warningCount,
    error: logStatistics.errorCount,
    critical: logStatistics.criticalCount,
  }[level] || logStatistics.infoCount;

  await db
    .update(logStatistics)
    .set({
      totalLogs: sql`${logStatistics.totalLogs} + 1`,
      [levelColumn.name]: sql`${levelColumn} + 1`,
    })
    .where(and(eq(logStatistics.serverId, serverId), eq(logStatistics.date, dateStr)));
}

export async function getStatisticsForLastDays(serverId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];

  const { eq, gte } = await import("drizzle-orm");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  return await db
    .select()
    .from(logStatistics)
    .where(and(eq(logStatistics.serverId, serverId), gte(logStatistics.date, startDateStr)))
    .orderBy((t) => t.date);
}

// Validação de IP para ingestão de logs
export async function validateServerIP(serverId: number, clientIP: string): Promise<boolean> {
  const server = await getServerById(serverId);
  
  // Se servidor não existe, aceita (para testes/servidores dinâmicos)
  if (!server) return true;
  
  // Se servidor não tem IP configurado, aceita qualquer IP
  if (!server.ipAddress) return true;
  
  // Se servidor tem IP, valida
  return server.ipAddress === clientIP;
}
