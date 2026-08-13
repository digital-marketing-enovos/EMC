import { describe, test, beforeEach } from "vitest";
import assert from "node:assert/strict";

import { ITEMS } from "../items";
import { computeScores } from "../scoring";
import { DEFAULT_TEXTS, getTexts, resetTexts, resolveItems, saveTexts, TEXT_MAX } from "../content";

// No DATABASE_URL under test, so content.ts uses its in-memory store.
beforeEach(async () => {
  await resetTexts();
});

describe("editable wording", () => {
  test("defaults cover every item and match the code constants", async () => {
    const texts = await getTexts();
    assert.equal(Object.keys(texts).length, 12);
    for (const item of ITEMS) {
      assert.equal(texts[item.id].theme, item.theme);
      assert.equal(texts[item.id].stem, item.stem);
      assert.equal(texts[item.id].low, item.low);
      assert.equal(texts[item.id].high, item.high);
    }
  });

  test("an edit replaces the wording and nothing else", async () => {
    const before = ITEMS.find((i) => i.id === 4)!;
    const res = await saveTexts({
      4: { theme: "Succession plan", stem: "New stem?", low: "New low.", high: "New high." },
    });
    assert.equal(res.ok, true);

    const item = (await resolveItems()).find((i) => i.id === 4)!;
    assert.equal(item.theme, "Succession plan");
    assert.equal(item.stem, "New stem?");
    assert.equal(item.low, "New low.");
    assert.equal(item.high, "New high.");
    // The fields that decide the score are untouched.
    assert.equal(item.axis, before.axis);
    assert.equal(item.flip, before.flip);
    assert.equal(item.id, before.id);
  });

  test("rewording every item cannot move a coordinate", async () => {
    const answers = Object.fromEntries(ITEMS.map((i) => [i.id, i.flip ? 3 : -3] as const));
    const before = computeScores(answers);

    await saveTexts(
      Object.fromEntries(
        ITEMS.map((i) => [i.id, { theme: `T${i.id}`, stem: `S${i.id}`, low: `L${i.id}`, high: `H${i.id}` }]),
      ),
    );

    const items = await resolveItems();
    assert.deepEqual(
      items.map((i) => [i.id, i.axis, i.flip]),
      ITEMS.map((i) => [i.id, i.axis, i.flip]),
    );
    assert.deepEqual(computeScores(answers), before);
    assert.equal(before.x, 1);
    assert.equal(before.y, 1);
  });

  test("restoring defaults for one item leaves the others edited", async () => {
    await saveTexts({
      1: { theme: "A", stem: "B", low: "C", high: "D" },
      2: { theme: "E", stem: "F", low: "G", high: "H" },
    });
    await resetTexts(1);
    const texts = await getTexts();
    assert.equal(texts[1].theme, DEFAULT_TEXTS[1].theme);
    assert.equal(texts[2].theme, "E");
  });

  test("blank, whitespace-only and over-long values are refused", async () => {
    const ok = { theme: "T", stem: "S", low: "L", high: "H" };
    for (const bad of ["", "   ", "\n\t"]) {
      assert.equal((await saveTexts({ 1: { ...ok, stem: bad } })).ok, false, `accepted ${JSON.stringify(bad)}`);
    }
    assert.equal((await saveTexts({ 1: { ...ok, theme: "x".repeat(TEXT_MAX.theme + 1) } })).ok, false);
    assert.equal((await saveTexts({ 1: { ...ok, low: "x".repeat(TEXT_MAX.low + 1) } })).ok, false);
    // Nothing was written by any of those attempts.
    assert.equal((await getTexts())[1].theme, DEFAULT_TEXTS[1].theme);
  });

  test("unknown ids and malformed payloads are refused", async () => {
    const ok = { theme: "T", stem: "S", low: "L", high: "H" };
    assert.equal((await saveTexts({ 13: ok })).ok, false);
    assert.equal((await saveTexts({ 1: "nope" })).ok, false);
    assert.equal((await saveTexts({})).ok, false);
    assert.equal((await saveTexts(null)).ok, false);
    assert.equal((await saveTexts([])).ok, false);
  });

  test("whitespace is normalised so a stray newline cannot break a card", async () => {
    await saveTexts({ 1: { theme: " Recognition ", stem: "a\n\n  b", low: "  c  ", high: "d" } });
    const texts = await getTexts();
    assert.equal(texts[1].theme, "Recognition");
    assert.equal(texts[1].stem, "a b");
    assert.equal(texts[1].low, "c");
  });
});
