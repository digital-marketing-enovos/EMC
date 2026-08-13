import { ITEMS } from "@/lib/items";
import { notFound, resolveSession } from "@/lib/http";
import { listResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/**
 * Quote anything that could confuse a spreadsheet, and neutralise formula
 * injection in free text. Plain numbers — including negative answers like -3 —
 * are passed through untouched so they stay numeric in Excel.
 */
function cell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s !== "" && Number.isFinite(Number(s))) return s;
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Raw responses as CSV: one row per participant, all 24 answers plus coordinates. */
export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const k = new URL(req.url).searchParams.get("k");
  const session = await resolveSession(code, { secret: k });
  if (!session) return notFound();

  const responses = await listResponses(session.id);

  const header = [
    "response_id",
    "label",
    "created_at",
    "today_x",
    "today_y",
    "target_x",
    "target_y",
    ...ITEMS.flatMap((i) => [`item_${i.id}_today`, `item_${i.id}_target`]),
  ];

  const rows = responses.map((r) =>
    [
      r.id,
      r.label ?? "",
      r.createdAt,
      r.today.x.toFixed(4),
      r.today.y.toFixed(4),
      r.target.x.toFixed(4),
      r.target.y.toFixed(4),
      ...ITEMS.flatMap((i) => [
        r.answers[String(i.id)]?.today ?? "",
        r.answers[String(i.id)]?.target ?? "",
      ]),
    ].map(cell),
  );

  // BOM so Excel opens the UTF-8 labels correctly.
  const csv = "﻿" + [header.map(cell), ...rows].map((r) => r.join(",")).join("\r\n") + "\r\n";
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cultural-compass-${session.code}-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
