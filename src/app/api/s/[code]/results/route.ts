import { json, notFound, resolveSession } from "@/lib/http";
import { listResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** Every response in the session. Secret-gated; polled every 3s by /results. */
export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const k = new URL(req.url).searchParams.get("k");
  const session = await resolveSession(code, { secret: k });
  if (!session) return notFound();

  const responses = await listResponses(session.id);
  return json({
    closed: Boolean(session.closedAt),
    count: responses.length,
    responses: responses.map((r) => ({
      id: r.id,
      label: r.label,
      today: r.today,
      target: r.target,
      createdAt: r.createdAt,
    })),
  });
}
