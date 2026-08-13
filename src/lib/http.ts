import "server-only";
import { getSessionByCode, secretMatches, type Session } from "./store";

export const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    // The facilitator screen polls; never let a proxy hand back a stale count.
    headers: { "cache-control": "no-store" },
  });

export const notFound = () => json({ error: "not found" }, 404);

/**
 * Resolves a session from the route, or null.
 * When `secret` is required, a wrong or missing key is indistinguishable from
 * an unknown session — both 404 — so /results never leaks that a code exists.
 */
export async function resolveSession(
  code: string,
  opts: { secret?: string | null } = {},
): Promise<Session | null> {
  const session = await getSessionByCode(code);
  if (!session) return null;
  if (opts.secret !== undefined && !secretMatches(session.secret, opts.secret)) return null;
  return session;
}
