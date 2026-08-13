// Applies db/schema.sql. Idempotent.
//   npm run db:migrate            (reads .env.local)
//   DATABASE_URL=... node scripts/migrate.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

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
