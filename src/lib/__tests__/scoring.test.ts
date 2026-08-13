import { describe, test } from "vitest";
import assert from "node:assert/strict";

import { DISPLAY_ORDER, ITEMS, RAW_VALUES, type Item, type Raw } from "../items";
import {
  computeCoords,
  computeScores,
  getZone,
  groupStats,
  parseAnswers,
  readSpread,
  signed,
  toCoord,
  type Answers,
} from "../scoring";

// ─── HELPERS ───────────────────────────────────────────────────
// Everything below is expressed in POLES, never in screen sides. The whole
// point of the flip flag is that the two differ.

/** The raw (on-screen) value a participant taps to endorse `pole` at `strength`. */
function tapOnPole(item: Item, pole: "low" | "high", strength: 1 | 3): Raw {
  const wanted = pole === "low" ? -strength : strength;
  return (item.flip ? -wanted : wanted) as Raw;
}

/** Answer every item by endorsing the same pole at the same strength. */
function allOnPole(pole: "low" | "high", strength: 1 | 3): Record<number, Raw> {
  return Object.fromEntries(ITEMS.map((i) => [i.id, tapOnPole(i, pole, strength)]));
}

/** Answer every item with the same raw value — i.e. always tap the same button. */
function allRaw(raw: Raw): Record<number, Raw> {
  return Object.fromEntries(ITEMS.map((i) => [i.id, raw]));
}

const near = (actual: number, expected: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, msg ?? `${actual} ≈ ${expected}`);

// ─── ITEM SET INVARIANTS ───────────────────────────────────────

describe("item set", () => {
  test("twelve items, six per axis", () => {
    assert.equal(ITEMS.length, 12);
    assert.equal(ITEMS.filter((i) => i.axis === "X").length, 6);
    assert.equal(ITEMS.filter((i) => i.axis === "Y").length, 6);
  });

  test("exactly three of the six items on each axis are flipped", () => {
    // This is what makes "always tap the leftmost button" score dead centre.
    for (const axis of ["X", "Y"] as const) {
      const flipped = ITEMS.filter((i) => i.axis === axis && i.flip).length;
      assert.equal(flipped, 3, `axis ${axis} has ${flipped} flipped items, expected 3`);
    }
  });

  test("ids are 1–12, X first then Y", () => {
    assert.deepEqual(
      ITEMS.map((i) => i.id),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    );
    assert.deepEqual(
      ITEMS.filter((i) => i.axis === "X").map((i) => i.id),
      [1, 2, 3, 4, 5, 6],
    );
  });
});

describe("display order", () => {
  test("is a permutation of every item id", () => {
    assert.deepEqual([...DISPLAY_ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test("never shows two items of the same axis back to back", () => {
    const axes = DISPLAY_ORDER.map((id) => ITEMS.find((i) => i.id === id)!.axis);
    for (let i = 1; i < axes.length; i++) {
      assert.notEqual(axes[i], axes[i - 1], `positions ${i} and ${i + 1} share axis ${axes[i]}`);
    }
  });
});

// ─── THE FOUR SECTION-9 INVARIANTS ─────────────────────────────

describe("scoring, stated in poles", () => {
  test("every item answered -3 on its LOW pole → x = 1 and y = 1", () => {
    const { x, y } = computeScores(allOnPole("low", 3));
    near(x!, 1);
    near(y!, 1);
  });

  test("every item answered +3 on its HIGH pole → x = 5 and y = 5", () => {
    const { x, y } = computeScores(allOnPole("high", 3));
    near(x!, 5);
    near(y!, 5);
  });

  test("every raw answer -3 regardless of flip → x = 3 and y = 3", () => {
    // Always tapping the leftmost button is meaningless: the three flipped
    // items on each axis cancel the three unflipped ones.
    const { x, y } = computeScores(allRaw(-3));
    near(x!, 3);
    near(y!, 3);
  });

  test("every raw answer +3 regardless of flip → x = 3 and y = 3", () => {
    const { x, y } = computeScores(allRaw(3));
    near(x!, 3);
    near(y!, 3);
  });

  test("a flipped item is the exact mirror of an unflipped one", () => {
    const flipped = ITEMS.filter((i) => i.flip);
    const plain = ITEMS.filter((i) => !i.flip);
    assert.ok(flipped.length && plain.length);
    for (const f of flipped) {
      for (const p of plain) {
        for (const raw of RAW_VALUES) {
          assert.equal(
            signed(f, raw),
            -signed(p, raw),
            `item ${f.id} (flip) vs item ${p.id} at raw ${raw}`,
          );
        }
      }
    }
  });

  test("endorsing a pole scores the same whether or not the item is flipped", () => {
    for (const item of ITEMS) {
      near(signed(item, tapOnPole(item, "low", 3)), -3, `item ${item.id} low·3`);
      near(signed(item, tapOnPole(item, "low", 1)), -1, `item ${item.id} low·1`);
      near(signed(item, tapOnPole(item, "high", 1)), 1, `item ${item.id} high·1`);
      near(signed(item, tapOnPole(item, "high", 3)), 3, `item ${item.id} high·3`);
    }
  });
});

describe("coordinate mapping", () => {
  test("[-3, 3] maps onto [1, 5]", () => {
    near(toCoord(-3), 1);
    near(toCoord(0), 3);
    near(toCoord(3), 5);
    near(toCoord(1.5), 4);
    near(toCoord(-1.5), 2);
  });

  test("the softest possible one-sided answer stays inside the grid", () => {
    const { x, y } = computeScores(allOnPole("high", 1));
    near(x!, 3 + (1 / 3) * 2);
    assert.ok(x! < 5 && x! > 3);
    near(y!, x!);
  });

  test("one axis moves independently of the other", () => {
    const answers: Record<number, Raw> = {
      ...Object.fromEntries(ITEMS.filter((i) => i.axis === "X").map((i) => [i.id, tapOnPole(i, "high", 3)])),
      ...Object.fromEntries(ITEMS.filter((i) => i.axis === "Y").map((i) => [i.id, tapOnPole(i, "low", 3)])),
    };
    const { x, y } = computeScores(answers);
    near(x!, 5);
    near(y!, 1);
  });

  test("partial answers score on what is filled, and are null when empty", () => {
    assert.deepEqual(computeScores({}), { x: null, y: null });
    const oneX = { [ITEMS[0].id]: tapOnPole(ITEMS[0], "high", 3) };
    const { x, y } = computeScores(oneX);
    near(x!, 5);
    assert.equal(y, null);
  });
});

describe("quadrants", () => {
  test("the low half includes the midline on both axes", () => {
    assert.equal(getZone(3, 3), "earth");
    assert.equal(getZone(3, 3.0001), "water");
    assert.equal(getZone(3.0001, 3), "air");
    assert.equal(getZone(3.0001, 3.0001), "fire");
  });

  test("corners land in the expected worlds", () => {
    assert.equal(getZone(1, 5), "water"); // collectivism · fragmentation
    assert.equal(getZone(5, 5), "fire"); // individualism · fragmentation
    assert.equal(getZone(1, 1), "earth"); // collectivism · integration
    assert.equal(getZone(5, 1), "air"); // individualism · integration
  });

  test("an unscored axis has no zone", () => {
    assert.equal(getZone(null, 4), null);
    assert.equal(getZone(4, null), null);
  });
});

// ─── SUBMISSION PARSING ────────────────────────────────────────

function fullSubmission(
  pick: (item: Item, kind: "today" | "target") => Raw,
): Answers {
  const out: Answers = {};
  for (const item of ITEMS) {
    out[String(item.id)] = { today: pick(item, "today"), target: pick(item, "target") };
  }
  return out;
}

describe("parseAnswers", () => {
  test("accepts a complete, well-formed submission", () => {
    const body = fullSubmission((i, kind) => tapOnPole(i, kind === "today" ? "low" : "high", 3));
    const res = parseAnswers(body);
    assert.equal(res.ok, true);
  });

  test("rejects a missing item", () => {
    const body = fullSubmission(() => 3);
    delete body["7"];
    const res = parseAnswers(body);
    assert.equal(res.ok, false);
    assert.match((res as { error: string }).error, /item 7/);
  });

  test("rejects a missing side", () => {
    const body = fullSubmission(() => 3) as Record<string, unknown>;
    body["4"] = { today: 3 };
    assert.equal(parseAnswers(body).ok, false);
  });

  test("rejects a midpoint or any off-scale value", () => {
    for (const bad of [0, 2, -2, 4, -4, 3.0001, "3", null, NaN]) {
      const body = fullSubmission(() => 3) as Record<string, unknown>;
      body["1"] = { today: bad, target: 3 };
      assert.equal(parseAnswers(body).ok, false, `accepted ${String(bad)}`);
    }
  });

  test("rejects unexpected item ids", () => {
    const body = fullSubmission(() => 3) as Record<string, unknown>;
    body["13"] = { today: 3, target: 3 };
    assert.equal(parseAnswers(body).ok, false);
  });

  test("rejects non-objects", () => {
    for (const bad of [null, [], "x", 3, undefined]) {
      assert.equal(parseAnswers(bad).ok, false, `accepted ${String(bad)}`);
    }
  });
});

describe("computeCoords", () => {
  test("today and target are scored independently", () => {
    const answers = fullSubmission((i, kind) =>
      kind === "today" ? tapOnPole(i, "low", 3) : tapOnPole(i, "high", 3),
    );
    const { today, target } = computeCoords(answers);
    near(today.x, 1);
    near(today.y, 1);
    near(target.x, 5);
    near(target.y, 5);
  });

  test("a raw-identical submission sits dead centre on both", () => {
    const { today, target } = computeCoords(fullSubmission(() => -3));
    for (const v of [today.x, today.y, target.x, target.y]) near(v, 3);
  });
});

// ─── GROUP STATISTICS ──────────────────────────────────────────

describe("groupStats", () => {
  const row = (tx: number, ty: number, dx: number, dy: number) => ({
    today: { x: tx, y: ty },
    target: { x: dx, y: dy },
  });

  test("returns null with no responses", () => {
    assert.equal(groupStats([]), null);
  });

  test("a single response has zero spread", () => {
    const s = groupStats([row(2, 2, 4, 4)])!;
    assert.equal(s.n, 1);
    near(s.spreadToday, 0);
    near(s.spreadTarget, 0);
    near(s.meanMagnitude, Math.hypot(2, 2));
    near(s.coherence!, 1);
  });

  test("centroids and spread are the plain means", () => {
    const s = groupStats([row(2, 2, 3, 3), row(4, 4, 5, 5)])!;
    near(s.centroidToday.x, 3);
    near(s.centroidTarget.y, 4);
    near(s.spreadToday, Math.hypot(1, 1));
  });

  test("parallel vectors give full coherence, opposed ones cancel", () => {
    const parallel = groupStats([row(1, 3, 2, 3), row(2, 3, 3, 3)])!;
    near(parallel.coherence!, 1);

    // Two people pulling in exactly opposite directions: the group mean vector
    // is null, so coherence is undefined rather than misleadingly zero.
    const opposed = groupStats([row(3, 3, 4, 3), row(3, 3, 2, 3)])!;
    assert.equal(opposed.coherence, null);

    // Mean vector points right; one of the three pulls left.
    const mixed = groupStats([row(3, 3, 4, 3), row(3, 3, 4, 3), row(3, 3, 2, 3)])!;
    assert.ok(mixed.coherence! > 0 && mixed.coherence! < 1);
  });

  test("a group that does not move has no coherence figure", () => {
    const s = groupStats([row(3, 3, 3, 3), row(2, 2, 2, 2)])!;
    assert.equal(s.coherence, null);
  });
});

describe("spread bands", () => {
  test("thresholds are 0.35 and 0.75", () => {
    assert.equal(readSpread(0), "strong alignment");
    assert.equal(readSpread(0.3499), "strong alignment");
    assert.equal(readSpread(0.35), "partial convergence");
    assert.equal(readSpread(0.7499), "partial convergence");
    assert.equal(readSpread(0.75), "marked divergence");
    assert.equal(readSpread(4), "marked divergence");
  });
});
