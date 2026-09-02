import { hasDatabase, query } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Setup check for the day of the workshop.
 *
 * A misconfigured database makes every screen fail with an identical, opaque
 * 500, and the three causes need three different fixes. This reports which one
 * it is. It returns booleans and a hint only — never the connection string,
 * the host, or a driver stack trace.
 */
export async function GET() {
  if (!hasDatabase) {
    return json({
      ok: false,
      databaseUrlSet: false,
      canConnect: null,
      schemaReady: null,
      hint: "Set DATABASE_URL in the Vercel project's environment variables, then redeploy.",
    });
  }

  try {
    await query("SELECT 1");
  } catch {
    return json({
      ok: false,
      databaseUrlSet: true,
      canConnect: false,
      schemaReady: null,
      hint: "DATABASE_URL is set but the database refused the connection. Check the credentials, and that the string ends with ?sslmode=require.",
    });
  }

  const expected = ["sessions", "responses", "item_texts"];
  let present: string[] = [];
  try {
    const rows = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [expected],
    );
    present = rows.map((r) => r.table_name);
  } catch {
    // fall through: treated as a missing schema
  }

  const missing = expected.filter((t) => !present.includes(t));
  if (missing.length) {
    return json({
      ok: false,
      databaseUrlSet: true,
      canConnect: true,
      schemaReady: false,
      missingTables: missing,
      hint: "Connected, but the tables do not exist. Run: DATABASE_URL='…' npm run db:migrate",
    });
  }

  return json({ ok: true, databaseUrlSet: true, canConnect: true, schemaReady: true });
}
