"use client";

import { C, FM } from "@/lib/theme";

/** Ported verbatim from the reference prototype. `scale` enlarges it for the projector. */
export function AxisBar({
  label,
  today,
  target,
  lLabel,
  rLabel,
  scale = 1,
}: {
  label: string;
  today: number | null;
  target: number | null;
  lLabel: string;
  rLabel: string;
  scale?: number;
}) {
  const pct = (v: number) => ((v - 1) / 4) * 100;
  const delta = today !== null && target !== null ? target - today : null;
  const px = (v: number) => `${v * scale}px`;

  return (
    <div style={{ marginBottom: px(20) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: px(9),
          alignItems: "baseline",
          gap: px(10),
        }}
      >
        <span
          style={{
            fontSize: px(10),
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.t2,
          }}
        >
          {label}
        </span>
        {delta !== null && today !== null && target !== null && (
          <span
            style={{
              fontSize: px(11),
              fontWeight: 600,
              color: Math.abs(delta) < 0.25 ? C.t3 : C.text,
              fontFamily: FM,
              whiteSpace: "nowrap",
            }}
          >
            {today.toFixed(2)} → {target.toFixed(2)}
            <span style={{ color: C.t3 }}>
              {"  "}({delta > 0 ? "+" : ""}
              {delta.toFixed(2)})
            </span>
          </span>
        )}
      </div>
      <div style={{ height: px(2), background: C.border, borderRadius: px(1), position: "relative" }}>
        {today !== null && target !== null && (
          <div
            style={{
              position: "absolute",
              left: `${Math.min(pct(today), pct(target))}%`,
              width: `${Math.abs(pct(target) - pct(today))}%`,
              top: 0,
              height: px(2),
              background: C.active,
              opacity: 0.25,
            }}
          />
        )}
        {today !== null && (
          <div
            style={{
              position: "absolute",
              left: `${pct(today)}%`,
              top: px(-4),
              width: px(10),
              height: px(10),
              border: `${px(2)} solid ${C.today}`,
              background: C.bg,
              borderRadius: "50%",
              transform: "translateX(-50%)",
              boxSizing: "border-box",
            }}
          />
        )}
        {target !== null && (
          <div
            style={{
              position: "absolute",
              left: `${pct(target)}%`,
              top: px(-5),
              width: px(12),
              height: px(12),
              background: C.active,
              borderRadius: "50%",
              transform: "translateX(-50%)",
              boxShadow: "0 1px 4px rgba(0,0,0,.15)",
            }}
          />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: px(10) }}>
        <span style={{ fontSize: px(10), color: C.t3 }}>{lLabel}</span>
        <span style={{ fontSize: px(10), color: C.t3 }}>{rLabel}</span>
      </div>
    </div>
  );
}
