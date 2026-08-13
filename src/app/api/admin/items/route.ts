import { adminKeyMatches } from "@/lib/adminKey";
import { getOverrides, getTexts, resetTexts, saveTexts } from "@/lib/content";
import { json, notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

function gate(req: Request): boolean {
  return adminKeyMatches(new URL(req.url).searchParams.get("k"));
}

/** Current wording, plus which items are currently overridden. */
export async function GET(req: Request) {
  if (!gate(req)) return notFound();
  const [texts, overrides] = await Promise.all([getTexts(), getOverrides()]);
  return json({ texts, overridden: Object.keys(overrides).map(Number) });
}

/** Replace the wording of one or more items. */
export async function PUT(req: Request) {
  if (!gate(req)) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const result = await saveTexts(body);
  if (!result.ok) return json({ error: result.error }, 400);

  const [texts, overrides] = await Promise.all([getTexts(), getOverrides()]);
  return json({ texts, overridden: Object.keys(overrides).map(Number) });
}

/** Restore the defaults — `?id=7` for one item, no id for all of them. */
export async function DELETE(req: Request) {
  if (!gate(req)) return notFound();

  const raw = new URL(req.url).searchParams.get("id");
  if (raw !== null && !/^\d+$/.test(raw)) return json({ error: "invalid id" }, 400);
  await resetTexts(raw === null ? undefined : Number(raw));

  const [texts, overrides] = await Promise.all([getTexts(), getOverrides()]);
  return json({ texts, overridden: Object.keys(overrides).map(Number) });
}
