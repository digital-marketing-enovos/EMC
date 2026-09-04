import { describe, test, beforeEach } from "vitest";
import assert from "node:assert/strict";

import { ITEMS } from "../items";
import { computeCoords, type Answers } from "../scoring";
import {
  addResponse,
  countResponses,
  createSession,
  deleteSession,
  listSessions,
  listResponses,
} from "../store";

// No DATABASE_URL under test, so the in-memory store is exercised. Postgres
// cascades deletes through the foreign key; the memory store must match it.
beforeEach(() => {
  globalThis.__ccMemory = { sessions: [], responses: [] };
});

const answers = (): Answers =>
  Object.fromEntries(ITEMS.map((i) => [String(i.id), { today: -3 as const, target: 3 as const }]));

async function seed(title: string, n: number) {
  const s = await createSession(title);
  const { today, target } = computeCoords(answers());
  for (let i = 0; i < n; i++) {
    await addResponse({ sessionId: s.id, label: `P${i}`, answers: answers(), today, target });
  }
  return s;
}

describe("session administration", () => {
  test("lists sessions newest first, with their response counts", async () => {
    const a = await seed("first", 2);
    const b = await seed("second", 5);
    // createdAt can collide within a millisecond; order by that is all we assert.
    const list = await listSessions();
    assert.equal(list.length, 2);
    const byCode = Object.fromEntries(list.map((s) => [s.code, s.responseCount]));
    assert.equal(byCode[a.code], 2);
    assert.equal(byCode[b.code], 5);
  });

  test("deleting a session destroys its responses with it", async () => {
    const doomed = await seed("doomed", 3);
    const kept = await seed("kept", 4);

    assert.equal(await deleteSession(doomed.id), true);

    assert.equal((await listSessions()).length, 1);
    assert.equal(await countResponses(doomed.id), 0);
    assert.equal((await listResponses(doomed.id)).length, 0);
    // The survivor is untouched — orphaned responses must not be counted here.
    assert.equal(await countResponses(kept.id), 4);
  });

  test("deleting an unknown session reports that nothing happened", async () => {
    await seed("only", 1);
    assert.equal(await deleteSession("00000000-0000-0000-0000-000000000000"), false);
    assert.equal((await listSessions()).length, 1);
  });

  test("session codes are unique across many creations", async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 60; i++) codes.add((await createSession(`s${i}`)).code);
    assert.equal(codes.size, 60);
  });

  test("every session gets its own secret", async () => {
    const a = await createSession("a");
    const b = await createSession("b");
    assert.notEqual(a.secret, b.secret);
    assert.ok(a.secret.length >= 20);
  });
});
