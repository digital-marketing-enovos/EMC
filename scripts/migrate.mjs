// Applies db/schema.sql. Idempotent.
//   npm run db:migrate            (reads .env.local)
//   DATABASE_URL=... node scripts/migrate.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

// Same aliases the app accepts: hosting providers name this variable differently.
const NAMES = ["DATABASE_URL", "POSTGRES_URL", "STORAGE_URL", "NEON_DATABASE_URL",
               "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];
const isPg = (v) => typeof v === "string" && /^postgres(ql)?:\/\//.test(v.trim());
const name = NAMES.find((n) => isPg(process.env[n])) ??
             Object.keys(process.env).find((n) => isPg(process.env[n]));
const url = name ? process.env[name].trim() : null;
if (!url) {
  console.error("No Postgres connection string found. Put one in .env.local as DATABASE_URL='…'");
  process.exit(1);
}
console.log(`using ${name}`);

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");

const { hostname, searchParams } = new URL(url);
const local = ["localhost", "127.0.0.1", "::1"].includes(hostname);
const client = new pg.Client({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: searchParams.get("sslmode") !== "no-verify" },
});

await client.connect();
await client.query(sql);
await client.end();
console.log("schema applied to", hostname);
