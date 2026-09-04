import { adminKeyMatches } from "@/lib/adminKey";
import { json, notFound } from "@/lib/http";
import { deleteSession, getSessionByCode } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** Delete a session and every response it holds. Irreversible. */
export async function DELETE(req: Request, ctx: Ctx) {
  if (!adminKeyMatches(new URL(req.url).searchParams.get("k"))) return notFound();

  const { code } = await ctx.params;
  const session = await getSessionByCode(code);
  if (!session) return notFound();

  const deleted = await deleteSession(session.id);
  return json({ deleted, code: session.code });
}
