import { json, notFound, resolveSession } from "@/lib/http";
import { closeSession } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** Set closed_at. New submissions are refused from then on. Secret-gated. */
export async function POST(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const k = new URL(req.url).searchParams.get("k");
  const session = await resolveSession(code, { secret: k });
  if (!session) return notFound();

  await closeSession(session.id);
  return json({ closed: true });
}
