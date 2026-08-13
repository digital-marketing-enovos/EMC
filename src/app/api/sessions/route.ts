import { createSession } from "@/lib/store";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Create a session. Used by the facilitator home page and by scripts/seed.mjs. */
export async function POST(req: Request) {
  let title = "Cultural Compass";
  try {
    const body = (await req.json()) as { title?: unknown };
    if (typeof body?.title === "string" && body.title.trim()) title = body.title;
  } catch {
    // no body — keep the default title
  }
  const session = await createSession(title);
  return json({ code: session.code, secret: session.secret, title: session.title }, 201);
}
