import "server-only";
import { ITEMS, type Item } from "./items";
import { hasDatabase, query } from "./db";

/**
 * Wording overrides for the twelve items.
 *
 * Only `theme`, `stem`, `low` and `high` are editable. `id`, `axis` and `flip`
 * stay in code: they decide which axis an answer lands on and whether it is
 * negated, so making them editable would let a typo silently rewrite every
 * coordinate — including those of responses already collected.
 */
export type ItemText = { theme: string; stem: string; low: string; high: string };
export type ItemTextMap = Record<number, ItemText>;

export const TEXT_MAX = { theme: 40, stem: 400, low: 400, high: 400 } as const;

export const DEFAULT_TEXTS: ItemTextMap = Object.fromEntries(
  ITEMS.map((i) => [i.id, { theme: i.theme, stem: i.stem, low: i.low, high: i.high }]),
);

type Memory = ItemTextMap;
declare global {
  // eslint-disable-next-line no-var
  var __ccTexts: Memory | undefined;
}
function memory(): Memory {
  if (!globalThis.__ccTexts) globalThis.__ccTexts = {};
  return globalThis.__ccTexts;
}

type Row = { id: number; theme: string; stem: string; low: string; high: string };

/** Overrides currently stored — may be empty or cover only some items. */
export async function getOverrides(): Promise<ItemTextMap> {
  if (!hasDatabase) return { ...memory() };
  const rows = await query<Row>(`SELECT id, theme, stem, low, high FROM item_texts`);
  const out: ItemTextMap = {};
  for (const r of rows) {
    if (DEFAULT_TEXTS[r.id]) out[r.id] = { theme: r.theme, stem: r.stem, low: r.low, high: r.high };
  }
  return out;
}

/** Defaults with any overrides applied — what the questionnaire renders. */
export async function getTexts(): Promise<ItemTextMap> {
  const overrides = await getOverrides();
  const out: ItemTextMap = {};
  for (const id of Object.keys(DEFAULT_TEXTS).map(Number)) {
    out[id] = { ...DEFAULT_TEXTS[id], ...overrides[id] };
  }
  return out;
}

/** The item list the participant sees: code-owned scoring fields, edited wording. */
export async function resolveItems(): Promise<Item[]> {
  const texts = await getTexts();
  return ITEMS.map((item) => ({ ...item, ...texts[item.id] }));
}

export type SaveResult = { ok: true } | { ok: false; error: string };

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const s = value.replace(/\s+/g, " ").trim();
  if (!s || s.length > max) return null;
  return s;
}

/** Replace the wording of one or more items. Unknown ids and blanks are refused. */
export async function saveTexts(input: unknown): Promise<SaveResult> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "expected an object of item id → text" };
  }
  const parsed: [number, ItemText][] = [];

  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    const id = Number(key);
    if (!DEFAULT_TEXTS[id]) return { ok: false, error: `unknown item ${key}` };
    if (typeof raw !== "object" || raw === null) return { ok: false, error: `item ${key}: not an object` };

    const r = raw as Record<string, unknown>;
    const theme = clean(r.theme, TEXT_MAX.theme);
    const stem = clean(r.stem, TEXT_MAX.stem);
    const low = clean(r.low, TEXT_MAX.low);
    const high = clean(r.high, TEXT_MAX.high);
    if (!theme) return { ok: false, error: `item ${key}: theme is empty or too long` };
    if (!stem) return { ok: false, error: `item ${key}: statement is empty or too long` };
    if (!low) return { ok: false, error: `item ${key}: left proposition is empty or too long` };
    if (!high) return { ok: false, error: `item ${key}: right proposition is empty or too long` };
    parsed.push([id, { theme, stem, low, high }]);
  }
  if (!parsed.length) return { ok: false, error: "nothing to save" };

  if (!hasDatabase) {
    const mem = memory();
    for (const [id, t] of parsed) mem[id] = t;
    return { ok: true };
  }

  for (const [id, t] of parsed) {
    await query(
      `INSERT INTO item_texts (id, theme, stem, low, high)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET theme = EXCLUDED.theme, stem = EXCLUDED.stem,
             low = EXCLUDED.low, high = EXCLUDED.high, updated_at = now()`,
      [id, t.theme, t.stem, t.low, t.high],
    );
  }
  return { ok: true };
}

/** Drop overrides — for one item, or for all of them. */
export async function resetTexts(id?: number): Promise<void> {
  if (id !== undefined && !DEFAULT_TEXTS[id]) return;

  if (!hasDatabase) {
    if (id === undefined) globalThis.__ccTexts = {};
    else delete memory()[id];
    return;
  }
  if (id === undefined) await query(`DELETE FROM item_texts`);
  else await query(`DELETE FROM item_texts WHERE id = $1`, [id]);
}
