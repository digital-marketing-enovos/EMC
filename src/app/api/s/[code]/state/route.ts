import { json, notFound, resolveSession } from "@/lib/http";
import { countResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/**
 * Submission count and open/closed flag — what the projected join screen polls.
 * A count is not a result: no coordinates, no aggregate, nothing per person.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const session = await resolveSession(code);
  if (!session) return notFound();
  return json({ count: await countResponses(session.id), closed: Boolean(session.closedAt) });
}
