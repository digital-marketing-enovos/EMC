"use client";

import { SCALE, type Item, type Kind, type Raw } from "@/lib/items";
import { C, FB, FM } from "@/lib/theme";

/**
 * Ported from the reference prototype. One deviation, required by section 7:
 * the scale buttons are 44px tall so they are tappable one-handed on a phone.
 */
export function ItemCard({
  item,
  idx,
  today,
  target,
  onAnswer,
}: {
  item: Item;
  idx: number;
  today?: Raw;
  target?: Raw;
  onAnswer: (id: number, kind: Kind, v: Raw) => void;
}) {
  // A flipped item shows its HIGH pole on the left.
  const leftText = item.flip ? item.high : item.low;
  const rightText = item.flip ? item.low : item.high;
  const done = today !== undefined && target !== undefined;

  // The label sits above its row so the four buttons span the card's full
  // width — the same width as the two propositions, which puts the gap between
  // button 2 and button 3 exactly under the divider that separates them.
  const Row = ({ kind, val, label }: { kind: Kind; val?: Raw; label: string }) => (
    <div style={{ marginBottom: kind === "today" ? "12px" : 0 }}>
      <span
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "9px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: kind === "today" ? C.t3 : C.text,
          fontWeight: 700,
          fontFamily: FB,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: "4px" }} role="radiogroup" aria-label={`${item.theme} — ${label}`}>
        {SCALE.map((s) => {
          const on = val === s.v;
          const solid = on && kind === "target";
          const outline = on && kind === "today";
          return (
            <button
              key={s.v}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={s.label}
              onClick={() => onAnswer(item.id, kind, s.v)}
              style={{
                flex: 1,
                minHeight: "44px",
                padding: "9px 2px",
                borderRadius: "6px",
                minWidth: 0,
                border: `1.5px solid ${on ? C.accent : C.border}`,
                background: solid ? C.accent : "transparent",
                color: solid ? "#fff" : outline ? C.accent : C.t3,
                fontSize: "10px",
                fontWeight: on ? 700 : 500,
                cursor: "pointer",
                transition: "all .12s",
                fontFamily: FB,
                lineHeight: 1.2,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: C.surface,
        borderRadius: "10px",
        padding: "18px 20px 16px",
        marginBottom: "12px",
        border: `1px solid ${done ? C.accent + "40" : C.border}`,
        boxShadow: done ? "0 1px 6px rgba(24,20,15,.05)" : "none",
        transition: "all .15s",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "baseline", marginBottom: "10px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: C.t3, flexShrink: 0, fontFamily: FM }}>
          {String(idx + 1).padStart(2, "0")}
        </span>
        <span
          style={{
            fontSize: "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.t3,
            fontWeight: 600,
          }}
        >
          {item.theme}
        </span>
      </div>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: C.text, margin: "0 0 14px", fontWeight: 500 }}>
        {item.stem}
      </p>
      {/* A 1px middle column, not a border on one side: it puts the divider on
          the exact centre line, where the gap between the two middle buttons is. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <p style={{ fontSize: "12.5px", lineHeight: 1.55, color: C.t2, margin: 0 }}>{leftText}</p>
        <div style={{ background: C.border }} />
        <p
          style={{
            fontSize: "12.5px",
            lineHeight: 1.55,
            color: C.t2,
            margin: 0,
            textAlign: "right",
          }}
        >
          {rightText}
        </p>
      </div>
      <Row kind="today" val={today} label="Today" />
      <Row kind="target" val={target} label="Tomorrow" />
    </div>
  );
}
