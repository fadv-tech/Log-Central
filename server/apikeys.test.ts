import { describe, it, expect } from "vitest";
import { 
  createApiKey, 
  getApiKeyByKey, 
  getApiKeysByServerId,
  getOrCreateLogStatistic,
  incrementLogStatistic,
  getLogStatisticsByServerId
} from "./db";

describe("API Keys and Statistics", () => {
  describe("API Key operations", () => {
    it("should create an API key", async () => {
      const result = await createApiKey({
        serverId: 1,
        key: `test-key-${Date.now()}`,
        name: "Test API Key",
        isActive: 1,
      });
      
      expect(result).toBeDefined();
    });

    it("should retrieve an API key by key string", async () => {
      const testKey = `test-key-${Date.now()}`;
      await createApiKey({
        serverId: 1,
        key: testKey,
        name: "Test API Key",
        isActive: 1,
      });

      const retrieved = await getApiKeyByKey(testKey);
      expect(retrieved).toBeDefined();
      expect(retrieved?.key).toBe(testKey);
    });

    it("should get API keys by server ID", async () => {
      const result = await getApiKeysByServerId(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Log Statistics operations", () => {
    it("should create or get log statistic for a date", async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await getOrCreateLogStatistic(1, today);
      
      expect(result).toBeDefined();
      expect(result?.serverId).toBe(1);
      expect(result?.date).toBe(today);
    });

    it("should increment log statistics", async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get initial state
      const before = await getOrCreateLogStatistic(1, today);
      const initialTotal = before?.totalLogs || 0;
      
      // Increment
      await incrementLogStatistic(1, today, 'info');
      
      // Get updated state
      const after = await getOrCreateLogStatistic(1, today);
      
      expect((after?.totalLogs || 0)).toBeGreaterThan(initialTotal);
    });

    it("should get statistics for last 7 days", async () => {
      const result = await getLogStatisticsByServerId(1, 7);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle different log levels in statistics", async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Increment different levels
      await incrementLogStatistic(1, today, 'error');
      await incrementLogStatistic(1, today, 'warning');
      await incrementLogStatistic(1, today, 'critical');
      
      const stat = await getOrCreateLogStatistic(1, today);
      
      expect(stat?.errorCount).toBeGreaterThan(0);
      expect(stat?.warningCount).toBeGreaterThan(0);
      expect(stat?.criticalCount).toBeGreaterThan(0);
    });
  });
});
