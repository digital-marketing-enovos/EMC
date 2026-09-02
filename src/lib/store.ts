import "server-only";
import { randomUUID, randomInt } from "node:crypto";
import { hasDatabase, query } from "./db";
import type { Answers, Point } from "./scoring";

export type Session = {
  id: string;
  code: string;
  secret: string;
  title: string;
  createdAt: string;
  closedAt: string | null;
};

export type StoredResponse = {
  id: string;
  sessionId: string;
  label: string | null;
  answers: Answers;
  today: Point;
  target: Point;
  createdAt: string;
};

export const LABEL_MAX = 12;

// ─── ID GENERATION ─────────────────────────────────────────────

/** Human-typable, unambiguous: no O/0, no I/1. e.g. "EMC-4821". */
export function makeCode(prefix = "EMC"): string {
  const digits = Array.from({ length: 4 }, () => randomInt(0, 10)).join("");
  return `${prefix}-${digits}`;
}

/** URL-safe facilitator key. 160 bits — not guessable in a workshop. */
export function makeSecret(): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 28 }, () => alphabet[randomInt(0, alphabet.length)]).join("");
}

/** Codes are typed by hand on a phone: compare case- and space-insensitively. */
export function normaliseCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Constant-time-ish comparison so a wrong key leaks nothing through timing. */
export function secretMatches(expected: string, given: string | null | undefined): boolean {
  if (!given || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

// ─── IN-MEMORY FALLBACK (local development only) ───────────────
// Lets `npm run dev` work with no database at all. Refused in production so a
// misconfigured deploy fails loudly instead of silently losing the workshop.

type Memory = { sessions: Session[]; responses: StoredResponse[] };
declare global {
  // eslint-disable-next-line no-var
  var __ccMemory: Memory | undefined;
}
function memory(): Memory {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is not set. Refusing to run on the in-memory store in production.",
    );
  }
  if (!globalThis.__ccMemory) globalThis.__ccMemory = { sessions: [], responses: [] };
  return globalThis.__ccMemory;
}

// ─── SESSIONS ──────────────────────────────────────────────────

type SessionRow = {
  id: string;
  code: string;
  secret: string;
  title: string;
  created_at: Date | string;
  closed_at: Date | string | null;
};

const iso = (v: Date | string | null): string | null =>
  v === null ? null : v instanceof Date ? v.toISOString() : v;

const toSession = (r: SessionRow): Session => ({
  id: r.id,
  code: r.code,
  secret: r.secret,
  title: r.title,
  createdAt: iso(r.created_at)!,
  closedAt: iso(r.closed_at),
});

export async function createSession(title: string): Promise<Session> {
  const clean = title.trim().slice(0, 80) || "Cultural Compass";

  if (!hasDatabase()) {
    const mem = memory();
    let code = makeCode();
    while (mem.sessions.some((s) => s.code === code)) code = makeCode();
    const session: Session = {
      id: randomUUID(),
      code,
      secret: makeSecret(),
      title: clean,
      createdAt: new Date().toISOString(),
      closedAt: null,
    };
    mem.sessions.push(session);
    return session;
  }

  // Four digits over ~one session at a time; retry is a formality.
  for (let attempt = 0; attempt < 8; attempt++) {
    const rows = await query<SessionRow>(
      `INSERT INTO sessions (code, secret, title)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO NOTHING
       RETURNING id, code, secret, title, created_at, closed_at`,
      [makeCode(), makeSecret(), clean],
    );
    if (rows.length) return toSession(rows[0]);
  }
  throw new Error("could not allocate a free session code");
}

export async function getSessionByCode(code: string): Promise<Session | null> {
  const wanted = normaliseCode(code);
  if (!wanted) return null;

  if (!hasDatabase()) {
    return memory().sessions.find((s) => s.code === wanted) ?? null;
  }
  const rows = await query<SessionRow>(
    `SELECT id, code, secret, title, created_at, closed_at FROM sessions WHERE code = $1`,
    [wanted],
  );
  return rows.length ? toSession(rows[0]) : null;
}

export async function closeSession(id: string): Promise<void> {
  if (!hasDatabase()) {
    const s = memory().sessions.find((x) => x.id === id);
    if (s && !s.closedAt) s.closedAt = new Date().toISOString();
    return;
  }
  await query(`UPDATE sessions SET closed_at = now() WHERE id = $1 AND closed_at IS NULL`, [id]);
}

// ─── RESPONSES ─────────────────────────────────────────────────

type ResponseRow = {
  id: string;
  session_id: string;
  label: string | null;
  answers: Answers;
  today_x: number;
  today_y: number;
  target_x: number;
  target_y: number;
  created_at: Date | string;
};

const toResponse = (r: ResponseRow): StoredResponse => ({
  id: r.id,
  sessionId: r.session_id,
  label: r.label,
  answers: r.answers,
  today: { x: r.today_x, y: r.today_y },
  target: { x: r.target_x, y: r.target_y },
  createdAt: iso(r.created_at)!,
});

export async function addResponse(input: {
  sessionId: string;
  label: string | null;
  answers: Answers;
  today: Point;
  target: Point;
}): Promise<StoredResponse> {
  const label = input.label?.trim().slice(0, LABEL_MAX) || null;

  if (!hasDatabase()) {
    const response: StoredResponse = {
      id: randomUUID(),
      sessionId: input.sessionId,
      label,
      answers: input.answers,
      today: input.today,
      target: input.target,
      createdAt: new Date().toISOString(),
    };
    memory().responses.push(response);
    return response;
  }

  const rows = await query<ResponseRow>(
    `INSERT INTO responses (session_id, label, answers, today_x, today_y, target_x, target_y)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, session_id, label, answers, today_x, today_y, target_x, target_y, created_at`,
    [
      input.sessionId,
      label,
      JSON.stringify(input.answers),
      input.today.x,
      input.today.y,
      input.target.x,
      input.target.y,
    ],
  );
  return toResponse(rows[0]);
}

export async function listResponses(sessionId: string): Promise<StoredResponse[]> {
  if (!hasDatabase()) {
    return memory()
      .responses.filter((r) => r.sessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const rows = await query<ResponseRow>(
    `SELECT id, session_id, label, answers, today_x, today_y, target_x, target_y, created_at
       FROM responses WHERE session_id = $1 ORDER BY created_at`,
    [sessionId],
  );
  return rows.map(toResponse);
}

export async function countResponses(sessionId: string): Promise<number> {
  if (!hasDatabase()) {
    return memory().responses.filter((r) => r.sessionId === sessionId).length;
  }
  const rows = await query<{ n: string }>(
    `SELECT count(*)::text AS n FROM responses WHERE session_id = $1`,
    [sessionId],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function getResponse(id: string): Promise<StoredResponse | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  if (!hasDatabase()) {
    return memory().responses.find((r) => r.id === id) ?? null;
  }
  const rows = await query<ResponseRow>(
    `SELECT id, session_id, label, answers, today_x, today_y, target_x, target_y, created_at
       FROM responses WHERE id = $1`,
    [id],
  );
  return rows.length ? toResponse(rows[0]) : null;
}
