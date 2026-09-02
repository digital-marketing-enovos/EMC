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

/**
 * Hosting providers name the connection string differently, and Vercel's
 * storage integrations let you pick a prefix — so the variable can end up as
 * STORAGE_URL, POSTGRES_URL or anything else. Rather than make the deploy
 * depend on getting one name right, look for the usual names and then for any
 * variable that actually holds a Postgres URL.
 */
const NAMED_CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "STORAGE_URL",
  "NEON_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

const isPostgresUrl = (v: string | undefined): v is string =>
  typeof v === "string" && /^postgres(ql)?:\/\//.test(v.trim());

type Resolved = { url: string; source: string } | null;
let cached: Resolved | undefined;

/** Resolved lazily: on Vercel the environment only exists at request time. */
function resolve(): Resolved {
  if (cached !== undefined) return cached;

  for (const name of NAMED_CANDIDATES) {
    const value = process.env[name]?.trim();
    if (isPostgresUrl(value)) return (cached = { url: value, source: name });
  }
  // Last resort: any variable whose value is a Postgres URL, so a custom
  // prefix works without anyone having to know this list exists.
  for (const [name, value] of Object.entries(process.env)) {
    if (isPostgresUrl(value?.trim())) return (cached = { url: value!.trim(), source: name });
  }
  return (cached = null);
}

export function hasDatabase(): boolean {
  return resolve() !== null;
}

/** Which environment variable the connection string came from. Never its value. */
export function databaseSource(): string | null {
  return resolve()?.source ?? null;
}

function poolConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const noVerify = url.searchParams.get("sslmode") === "no-verify";
  return {
    connectionString,
    ssl: local ? false : { rejectUnauthorized: !noVerify },
    // 20 phones and one facilitator screen; the pooler does the rest.
    max: 5,
    idleTimeoutMillis: 30_000,
    // Neon's free tier sleeps when idle; the first request has to wake it.
    connectionTimeoutMillis: 15_000,
  };
}

export function pool(): Pool {
  const found = resolve();
  if (!found) throw new Error("No Postgres connection string found in the environment");
  if (!globalThis.__ccPool) globalThis.__ccPool = new Pool(poolConfig(found.url));
  return globalThis.__ccPool;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool().query(text, params as never[]);
  return res.rows as T[];
}
