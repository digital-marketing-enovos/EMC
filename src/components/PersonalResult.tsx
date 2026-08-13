"use client";

import { MAX_VECTOR, WORLDS } from "@/lib/items";
import { getZone, type Point } from "@/lib/scoring";
import { C, DISPLAY_TRACKING, DISPLAY_WEIGHT, FD, FM } from "@/lib/theme";
import { AxisBar } from "./AxisBar";
import { Compass } from "./Compass";

/** Ported verbatim from the reference prototype. */
export function PersonalResult({ today, target }: { today: Point; target: Point }) {
  const zone = getZone(target.x, target.y);
  const w = zone ? WORLDS[zone] : null;
  const dx = target.x - today.x;
  const dy = target.y - today.y;
  const mag = Math.hypot(dx, dy);

  const dirs: string[] = [];
  if (Math.abs(dx) >= 0.25) dirs.push(dx > 0 ? "towards individualism" : "towards collectivism");
  if (Math.abs(dy) >= 0.25)
    dirs.push(dy > 0 ? "towards fragmentation and agility" : "towards integration and scale");

  const card = {
    background: C.surface,
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    marginBottom: "14px",
  } as const;

  return (
    <div>
      <div style={{ ...card, padding: "24px 24px 20px" }}>
        <h2 style={{ fontFamily: FD, fontSize: "22px", fontWeight: DISPLAY_WEIGHT, letterSpacing: DISPLAY_TRACKING, color: C.text, margin: "0 0 20px" }}>
          My compass
        </h2>
        <Compass
          size={300}
          dots={[
            { x: today.x, y: today.y, kind: "today", bold: true },
            { x: target.x, y: target.y, kind: "target", bold: true },
          ]}
          vectors={[{ x1: today.x, y1: today.y, x2: target.x, y2: target.y, bold: true }]}
        />
        <div style={{ marginTop: "22px", padding: "0 4px" }}>
          <AxisBar
            label="Axis I — Collectivism / Individualism"
            today={today.x}
            target={target.x}
            lLabel="Collectivism"
            rLabel="Individualism"
          />
          <AxisBar
            label="Axis II — Integration / Fragmentation"
            today={today.y}
            target={target.y}
            lLabel="Integration"
            rLabel="Fragmentation"
          />
        </div>
      </div>

      <div style={{ ...card, padding: "20px 24px" }}>
        <div
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.t3,
            marginBottom: "10px",
          }}
        >
          My change vector
        </div>
        {mag < 0.3 ? (
          <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: 0 }}>
            For you, the Enovos culture of tomorrow sits very close to today&apos;s. Worth testing against
            the rest of the EMC: is that a conviction, or a blind spot?
          </p>
        ) : (
          <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: 0 }}>
            You are calling for a shift <strong style={{ color: C.text }}>{dirs.join(" and ")}</strong>, with
            a magnitude of{" "}
            <strong style={{ color: C.text, fontFamily: FM }}>{mag.toFixed(2)}</strong> on a scale from 0 to{" "}
            {MAX_VECTOR.toFixed(2)}.
          </p>
        )}
        <div
          style={{
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: `1px solid ${C.border}`,
            fontSize: "12px",
            color: C.t3,
            fontFamily: FM,
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <span>
            Today · X {today.x.toFixed(2)} · Y {today.y.toFixed(2)}
          </span>
          <span>
            Tomorrow · X {target.x.toFixed(2)} · Y {target.y.toFixed(2)}
          </span>
        </div>
      </div>

      {w && (
        <div
          style={{
            background: w.color + "0F",
            borderRadius: "12px",
            border: `1px solid ${w.color}2A`,
            padding: "22px 24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: w.color,
              marginBottom: "10px",
            }}
          >
            The culture I am calling for
          </div>
          <div style={{ fontFamily: FD, fontSize: "25px", fontWeight: DISPLAY_WEIGHT, letterSpacing: DISPLAY_TRACKING, color: C.text, marginBottom: "2px" }}>
            <span style={{ marginRight: "8px" }}>{w.emoji}</span>
            {w.name} — {w.sub}
          </div>
          <div style={{ fontFamily: FD, fontSize: "15px", fontStyle: "italic", fontWeight: 400, color: C.t2, marginBottom: "10px" }}>
            {w.tagline}
          </div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: w.color,
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            {w.axes}
          </div>
          <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: 0 }}>{w.desc}</p>
        </div>
      )}
    </div>
  );
}
