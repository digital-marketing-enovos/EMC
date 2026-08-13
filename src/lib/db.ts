import "server-only";
import { Pool, type PoolConfig } from "pg";

/**
 * One pool per process, cached on globalThis so Next's dev hot-reload does not
 * leak connections. Neon and Supabase poolers both accept a plain
 * `postgresql://` URL; SSL is on unless the host is local.
 */
declare global {
  // eslint-disable-next-line no-var
  var __ccPool: Pool | undefined;
}

export const DATABASE_URL = process.env.DATABASE_URL?.trim() || "";
export const hasDatabase = DATABASE_URL.length > 0;

function poolConfig(): PoolConfig {
  const url = new URL(DATABASE_URL);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const noVerify = url.searchParams.get("sslmode") === "no-verify";
  return {
    connectionString: DATABASE_URL,
    ssl: local ? false : { rejectUnauthorized: !noVerify },
    // 20 phones and one facilitator screen; the pooler does the rest.
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}

export function pool(): Pool {
  if (!hasDatabase) throw new Error("DATABASE_URL is not set");
  if (!globalThis.__ccPool) globalThis.__ccPool = new Pool(poolConfig());
  return globalThis.__ccPool;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool().query(text, params as never[]);
  return res.rows as T[];
}
