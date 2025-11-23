import { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

/**
 * Local authentication without OAuth
 * Simple session-based auth for self-hosted deployments
 */

export interface LocalUser {
  id: number;
  username: string;
  role: "admin" | "user";
}

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, LocalUser>();

export function createLocalSession(user: LocalUser): string {
  const sessionId = Math.random().toString(36).substring(2, 15);
  sessionStore.set(sessionId, user);
  return sessionId;
}

export function getSessionUser(sessionId: string): LocalUser | null {
  return sessionStore.get(sessionId) || null;
}

export function deleteSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export function setAuthCookie(res: Response, req: Request, sessionId: string): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionId, cookieOptions);
}

export function getAuthCookie(req: Request): string | null {
  return req.cookies[COOKIE_NAME] || null;
}

/**
 * Default admin user for local deployments
 * In production, implement proper user management
 */
export const DEFAULT_ADMIN: LocalUser = {
  id: 1,
  username: "admin",
  role: "admin",
};

/**
 * Middleware to extract user from session cookie
 */
export function extractUserFromSession(req: Request): LocalUser | null {
  const sessionId = getAuthCookie(req);
  if (!sessionId) return null;
  return getSessionUser(sessionId);
}
