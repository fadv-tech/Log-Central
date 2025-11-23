import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Servers table - stores information about servers sending logs
 */
export const servers = mysqlTable("servers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  hostname: varchar("hostname", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  serverType: mysqlEnum("serverType", ["linux", "windows", "mikrotik", "other"]).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  lastHeartbeat: timestamp("lastHeartbeat"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Server = typeof servers.$inferSelect;
export type InsertServer = typeof servers.$inferInsert;

/**
 * Logs table - stores log entries with metadata
 */
export const logs = mysqlTable("logs", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").references(() => servers.id).notNull(),
  timestamp: bigint("timestamp", { mode: 'number' }).notNull(), // Unix timestamp in milliseconds (UTC)
  level: mysqlEnum("level", ["debug", "info", "warning", "error", "critical"]).notNull(),
  source: varchar("source", { length: 255 }).notNull(), // e.g., syslog, eventlog, api
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON string for additional metadata
  tags: varchar("tags", { length: 500 }), // Comma-separated tags
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;

/**
 * Log Sources Configuration - stores settings for different log sources
 */
export const logSources = mysqlTable("logSources", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").references(() => servers.id).notNull(),
  sourceType: varchar("sourceType", { length: 100 }).notNull(), // e.g., syslog, eventlog, api
  sourceConfig: text("sourceConfig"), // JSON string with source-specific configuration
  isEnabled: int("isEnabled").default(1).notNull(),
  lastIngestedAt: int("lastIngestedAt"), // Unix timestamp of last successful ingestion
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LogSource = typeof logSources.$inferSelect;
export type InsertLogSource = typeof logSources.$inferInsert;

/**
 * Log Filters/Rules - stores custom filters and rules for log processing
 */
export const logFilters = mysqlTable("logFilters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  filterConfig: text("filterConfig").notNull(), // JSON string with filter criteria
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LogFilter = typeof logFilters.$inferSelect;
export type InsertLogFilter = typeof logFilters.$inferInsert;

/**
 * API Keys table - stores API keys for server authentication
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").references(() => servers.id).notNull(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  lastUsedAt: int("lastUsedAt"), // Unix timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Log Statistics table - stores aggregated log statistics
 */
export const logStatistics = mysqlTable("logStatistics", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").references(() => servers.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  totalLogs: int("totalLogs").default(0).notNull(),
  debugCount: int("debugCount").default(0).notNull(),
  infoCount: int("infoCount").default(0).notNull(),
  warningCount: int("warningCount").default(0).notNull(),
  errorCount: int("errorCount").default(0).notNull(),
  criticalCount: int("criticalCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LogStatistic = typeof logStatistics.$inferSelect;
export type InsertLogStatistic = typeof logStatistics.$inferInsert;
