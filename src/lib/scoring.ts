import { ITEMS, RAW_VALUES, type Axis, type Item, type Raw, type ZoneKey } from "./items";

export type Point = { x: number; y: number };
/** Partial answers, keyed by item id — used while the questionnaire is in progress. */
export type PartialAnswers = Record<number, Raw | undefined>;
/** The persisted shape: every item id → both sides. */
export type AnswerPair = { today: Raw; target: Raw };
export type Answers = Record<string, AnswerPair>;

/**
 * A flipped item shows its HIGH pole on the LEFT, so the displayed position has
 * to be negated before it can be aggregated with the unflipped items.
 * This is an anti-position-bias device, not a scoring variant.
 */
export function signed(item: Item, raw: number): number {
  return item.flip ? -raw : raw;
}

/** mean of signed answers, [-3, 3] → coordinate, [1, 5] */
export function toCoord(mean: number): number {
  return 3 + (mean / 3) * 2;
}

function axisCoord(axis: Axis, answers: PartialAnswers): number | null {
  const qs = ITEMS.filter((i) => i.axis === axis);
  const filled = qs.filter((i) => answers[i.id] !== undefined);
  if (!filled.length) return null;
  const sum = filled.reduce((a, i) => a + signed(i, answers[i.id] as Raw), 0);
  return toCoord(sum / filled.length);
}

/** Null-tolerant scoring, for a questionnaire that may not be complete yet. */
export function computeScores(answers: PartialAnswers): { x: number | null; y: number | null } {
  return { x: axisCoord("X", answers), y: axisCoord("Y", answers) };
}

/** Strict scoring — throws unless every item on both axes is answered. */
export function computePoint(answers: PartialAnswers): Point {
  const { x, y } = computeScores(answers);
  const missing = ITEMS.filter((i) => answers[i.id] === undefined).map((i) => i.id);
  if (missing.length || x === null || y === null) {
    throw new Error(`incomplete answers, missing items: ${missing.join(", ")}`);
  }
  return { x, y };
}

/** Both coordinates for one submission. */
export function computeCoords(answers: Answers): { today: Point; target: Point } {
  const side = (kind: "today" | "target"): PartialAnswers => {
    const out: PartialAnswers = {};
    for (const item of ITEMS) out[item.id] = answers[String(item.id)]?.[kind];
    return out;
  };
  return { today: computePoint(side("today")), target: computePoint(side("target")) };
}

export function getZone(x: number | null, y: number | null): ZoneKey | null {
  if (x === null || y === null) return null;
  if (x <= 3 && y > 3) return "water";
  if (x > 3 && y > 3) return "fire";
  if (x <= 3 && y <= 3) return "earth";
  return "air";
}

// ─── VALIDATION ────────────────────────────────────────────────
// Everything arriving from a phone is untrusted: all 24 values must be present
// and each must be one of -3, -1, 1, 3.

function isRaw(v: unknown): v is Raw {
  return typeof v === "number" && (RAW_VALUES as number[]).includes(v);
}

export type ParseResult =
  | { ok: true; answers: Answers }
  | { ok: false; error: string };

export function parseAnswers(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "answers must be an object" };
  }
  const src = input as Record<string, unknown>;
  const answers: Answers = {};

  for (const item of ITEMS) {
    const key = String(item.id);
    const pair = src[key];
    if (typeof pair !== "object" || pair === null) {
      return { ok: false, error: `missing answer for item ${key}` };
    }
    const { today, target } = pair as Record<string, unknown>;
    if (!isRaw(today)) return { ok: false, error: `item ${key}: invalid "today" value` };
    if (!isRaw(target)) return { ok: false, error: `item ${key}: invalid "target" value` };
    answers[key] = { today, target };
  }

  const extra = Object.keys(src).filter((k) => !(k in answers));
  if (extra.length) return { ok: false, error: `unexpected keys: ${extra.join(", ")}` };

  return { ok: true, answers };
}

// ─── GROUP STATISTICS ──────────────────────────────────────────

export type GroupRow = { today: Point; target: Point };

export type GroupStats = {
  n: number;
  /** Centroid of the today marks. */
  centroidToday: Point;
  /** Centroid of the tomorrow marks. */
  centroidTarget: Point;
  /** Mean euclidean distance from the today centroid. */
  spreadToday: number;
  /** Mean euclidean distance from the tomorrow centroid. */
  spreadTarget: number;
  /** Mean length of the individual change vectors. */
  meanMagnitude: number;
  /** Mean cosine between each individual vector and the group mean vector, or null. */
  coherence: number | null;
};

export function groupStats(rows: GroupRow[]): GroupStats | null {
  const n = rows.length;
  if (!n) return null;

  const mean = (pick: (r: GroupRow) => number) => rows.reduce((a, r) => a + pick(r), 0) / n;
  const centroidToday = { x: mean((r) => r.today.x), y: mean((r) => r.today.y) };
  const centroidTarget = { x: mean((r) => r.target.x), y: mean((r) => r.target.y) };

  const spreadToday = mean((r) => Math.hypot(r.today.x - centroidToday.x, r.today.y - centroidToday.y));
  const spreadTarget = mean((r) => Math.hypot(r.target.x - centroidTarget.x, r.target.y - centroidTarget.y));
  const meanMagnitude = mean((r) => Math.hypot(r.target.x - r.today.x, r.target.y - r.today.y));

  const mv = { x: centroidTarget.x - centroidToday.x, y: centroidTarget.y - centroidToday.y };
  const mvn = Math.hypot(mv.x, mv.y);
  let coherence: number | null = null;
  if (mvn > 0.05) {
    coherence =
      rows.reduce((a, r) => {
        const vx = r.target.x - r.today.x;
        const vy = r.target.y - r.today.y;
        const len = Math.hypot(vx, vy);
        return a + (len < 0.05 ? 0 : (vx * mv.x + vy * mv.y) / (len * mvn));
      }, 0) / n;
  }

  return { n, centroidToday, centroidTarget, spreadToday, spreadTarget, meanMagnitude, coherence };
}

export function readSpread(s: number): string {
  return s < 0.35 ? "strong alignment" : s < 0.75 ? "partial convergence" : "marked divergence";
}
