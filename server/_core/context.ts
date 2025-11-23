import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // No authentication required - this is a local log server
  // All endpoints are public or use API Keys for ingestão
  const user: User | null = null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
