import { adminKeyMatches } from "@/lib/adminKey";
import { json, notFound } from "@/lib/http";
import { listSessions } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Every session, for the admin console. This includes each facilitator secret,
 * which is what makes a past session's results reachable at all — so it sits
 * behind ADMIN_KEY, the one credential that is not per-session.
 */
export async function GET(req: Request) {
  if (!adminKeyMatches(new URL(req.url).searchParams.get("k"))) return notFound();

  const sessions = await listSessions();
  return json({
    sessions: sessions.map((s) => ({
      code: s.code,
      secret: s.secret,
      title: s.title,
      createdAt: s.createdAt,
      closedAt: s.closedAt,
      responseCount: s.responseCount,
    })),
  });
}
