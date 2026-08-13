import "server-only";
import { secretMatches } from "./store";

/**
 * The admin screen is gated the same way the results screen is: a key in the
 * URL, no login. Set ADMIN_KEY in the environment. Without it, production has
 * no admin at all (every request 404s) rather than an open one; local
 * development falls back to "dev" so the screen is reachable while building.
 */
export function adminKey(): string | null {
  const fromEnv = process.env.ADMIN_KEY?.trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "production" ? null : "dev";
}

export function adminKeyMatches(given: string | null | undefined): boolean {
  const expected = adminKey();
  if (!expected) return false;
  return secretMatches(expected, given);
}
