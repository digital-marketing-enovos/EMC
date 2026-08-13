import { json, notFound, resolveSession } from "@/lib/http";
import { computeCoords, parseAnswers } from "@/lib/scoring";
import { addResponse, LABEL_MAX } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** Accept one participant submission. Coordinates are computed here, never on the phone. */
export async function POST(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const session = await resolveSession(code);
  if (!session) return notFound();
  if (session.closedAt) return json({ error: "This session is closed." }, 409);

  let body: { answers?: unknown; label?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const parsed = parseAnswers(body?.answers);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  if (body.label !== undefined && body.label !== null && typeof body.label !== "string") {
    return json({ error: "label must be a string" }, 400);
  }
  const label =
    typeof body.label === "string" ? body.label.trim().slice(0, LABEL_MAX) || null : null;

  const { today, target } = computeCoords(parsed.answers);
  const saved = await addResponse({
    sessionId: session.id,
    label,
    answers: parsed.answers,
    today,
    target,
  });

  return json({ id: saved.id, today: saved.today, target: saved.target }, 201);
}
