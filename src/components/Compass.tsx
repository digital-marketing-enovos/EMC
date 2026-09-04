"use client";

import { useState } from "react";
import { C, FB, FM } from "@/lib/theme";

export type Dot = {
  x: number;
  y: number;
  kind: "today" | "target";
  bold?: boolean;
  label?: string;
};

export type Vector = { x1: number; y1: number; x2: number; y2: number; bold?: boolean };

export type Legend = "both" | "today" | "tomorrow" | "none";

/**
 * Ported verbatim from the reference prototype. `size` is the viewBox geometry
 * and must stay at 300 — everything inside is tuned to it. `maxWidth` scales
 * the whole drawing, text and stroke widths included, for the projector.
 */
export function Compass({
  dots = [],
  vectors = [],
  size = 300,
  maxWidth,
  fill = false,
  legend = "both",
}: {
  dots?: Dot[];
  vectors?: Vector[];
  size?: number;
  /** Number of px, or any CSS length — e.g. "min(46vh, 620px)" on the projector. */
  maxWidth?: number | string;
  /** Fill the parent box instead of capping at a width. The viewBox keeps it square. */
  fill?: boolean;
  legend?: Legend;
}) {
  // Initials are shown on hover rather than pinned to every mark: printed
  // permanently they collide with each other and with the dots themselves,
  // exactly where the cloud is densest and reading it matters most.
  const [hovered, setHovered] = useState<number | null>(null);

  const pad = 46;
  const inner = size - pad * 2;
  const sx = (v: number) => pad + ((v - 1) / 4) * inner;
  // Y is inverted: high (fragmentation) is at the top of the screen.
  const sy = (v: number) => pad + ((5 - v) / 4) * inner;

  const quads = [
    { x: 0.24, y: 0.23, color: C.water, l1: "💧 WATER", l2: "Humans First" },
    { x: 0.76, y: 0.23, color: C.fire, l1: "🔥 FIRE", l2: "Innovation" },
    { x: 0.24, y: 0.77, color: C.earth, l1: "🌍 EARTH", l2: "Companies Care" },
    { x: 0.76, y: 0.77, color: C.air, l1: "💨 AIR", l2: "Corporate" },
  ];

  return (
    <svg
      width="100%"
      height={fill ? "100%" : undefined}
      viewBox={`0 0 ${size} ${size}`}
      style={
        fill
          ? { display: "block", width: "100%", height: "100%" }
          : {
              display: "block",
              margin: "0 auto",
              maxWidth: typeof maxWidth === "string" ? maxWidth : `${maxWidth ?? size}px`,
            }
      }
    >
      <defs>
        <marker id="ah" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={C.target} />
        </marker>
        <marker id="ah-soft" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={C.t3} />
        </marker>
      </defs>

      <rect x={pad} y={pad} width={inner / 2} height={inner / 2} fill={C.water + "12"} />
      <rect x={pad + inner / 2} y={pad} width={inner / 2} height={inner / 2} fill={C.fire + "12"} />
      <rect x={pad} y={pad + inner / 2} width={inner / 2} height={inner / 2} fill={C.earth + "12"} />
      <rect
        x={pad + inner / 2}
        y={pad + inner / 2}
        width={inner / 2}
        height={inner / 2}
        fill={C.air + "12"}
      />
      <rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke={C.border} strokeWidth="1" />
      <line
        x1={pad + inner / 2}
        y1={pad}
        x2={pad + inner / 2}
        y2={pad + inner}
        stroke={C.border}
        strokeWidth="1"
        strokeDasharray="5,4"
      />
      <line
        x1={pad}
        y1={pad + inner / 2}
        x2={pad + inner}
        y2={pad + inner / 2}
        stroke={C.border}
        strokeWidth="1"
        strokeDasharray="5,4"
      />

      {quads.map((q, i) => (
        <g key={i}>
          <text
            x={pad + inner * q.x}
            y={pad + inner * q.y - 7}
            textAnchor="middle"
            fill={q.color}
            fontSize="10"
            fontWeight="700"
            fontFamily={FB}
          >
            {q.l1}
          </text>
          <text
            x={pad + inner * q.x}
            y={pad + inner * q.y + 8}
            textAnchor="middle"
            fill={q.color + "AA"}
            fontSize="8.5"
            fontFamily={FB}
          >
            {q.l2}
          </text>
        </g>
      ))}

      <text
        x={pad + inner / 2}
        y={pad - 16}
        textAnchor="middle"
        fill={C.t3}
        fontSize="8"
        letterSpacing="1.8"
        fontFamily={FB}
      >
        FRAGMENTATION · AGILITY
      </text>
      <text
        x={pad + inner / 2}
        y={pad + inner + 26}
        textAnchor="middle"
        fill={C.t3}
        fontSize="8"
        letterSpacing="1.8"
        fontFamily={FB}
      >
        INTEGRATION · SCALE
      </text>
      <text
        x={13}
        y={pad + inner / 2}
        textAnchor="middle"
        fill={C.t3}
        fontSize="8"
        letterSpacing="1.8"
        fontFamily={FB}
        transform={`rotate(-90,13,${pad + inner / 2})`}
      >
        COLLECTIVISM
      </text>
      <text
        x={size - 13}
        y={pad + inner / 2}
        textAnchor="middle"
        fill={C.t3}
        fontSize="8"
        letterSpacing="1.8"
        fontFamily={FB}
        transform={`rotate(90,${size - 13},${pad + inner / 2})`}
      >
        INDIVIDUALISM
      </text>

      {vectors.map((v, i) => {
        const x1 = sx(v.x1);
        const y1 = sy(v.y1);
        const x2 = sx(v.x2);
        const y2 = sy(v.y2);
        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len < 4) return null;
        const k = (len - 7) / len; // stop short so the arrowhead sits on the target
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x1 + (x2 - x1) * k}
            y2={y1 + (y2 - y1) * k}
            stroke={v.bold ? C.target : C.t3}
            strokeWidth={v.bold ? 1.6 : 1}
            opacity={v.bold ? 0.85 : 0.45}
            markerEnd={v.bold ? "url(#ah)" : "url(#ah-soft)"}
          />
        );
      })}

      {dots.map((d, i) => {
        const cx = sx(d.x);
        const cy = sy(d.y);
        const on = hovered === i;
        const enter = d.label
          ? {
              onMouseEnter: () => setHovered(i),
              onMouseLeave: () => setHovered((h) => (h === i ? null : h)),
              style: { cursor: "pointer" as const },
            }
          : {};

        const hit = d.label ? (
          <circle cx={cx} cy={cy} r={11} fill="transparent" />
        ) : null;

        if (d.kind === "today") {
          const r = d.bold ? 6.5 : 5;
          return (
            <g key={i} {...enter}>
              {on && <circle cx={cx} cy={cy} r={r + 5} fill={C.accent} opacity={0.22} />}
              {/* A ring alone lets the quadrant lettering run straight through
                  its middle, and it stops reading as a mark. The disc behind it
                  knocks the label out; it stays translucent so a cluster of
                  overlapping marks still reads as several, not one. */}
              <circle cx={cx} cy={cy} r={r} fill={C.surface} opacity={d.bold ? 0.92 : 0.78} />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={on ? C.accent : C.today}
                strokeWidth={d.bold ? 2.2 : 1.7}
                opacity={d.bold ? 1 : 0.92}
              />
              {hit}
            </g>
          );
        }
        return (
          <g key={i} {...enter}>
            {d.bold && <circle cx={cx} cy={cy} r="13" fill={C.target} opacity="0.07" />}
            {on && <circle cx={cx} cy={cy} r={9} fill={C.accent} opacity={0.22} />}
            <circle
              cx={cx}
              cy={cy}
              r={d.bold ? 6.5 : 4}
              fill={on ? C.accent : C.target}
              opacity={d.bold ? 1 : on ? 1 : 0.6}
            />
            {d.bold && <circle cx={cx} cy={cy} r="2.6" fill={C.surface} />}
            {hit}
          </g>
        );
      })}

      {/* Drawn after every mark so it is never covered by one, and inert so it
          cannot steal the pointer from the dot underneath it. */}
      {(() => {
        const d = hovered === null ? null : dots[hovered];
        if (!d?.label) return null;
        const cx = sx(d.x);
        const cy = sy(d.y);
        const w = d.label.length * 5.4 + 12;
        const x = Math.min(Math.max(cx - w / 2, 2), size - w - 2);
        const above = cy - 24 > 2;
        const y = above ? cy - 24 : cy + 10;
        return (
          <g pointerEvents="none">
            <rect x={x} y={y} width={w} height={16} rx={8} fill={C.text} opacity={0.92} />
            <text
              x={x + w / 2}
              y={y + 11.4}
              textAnchor="middle"
              fill={C.surface}
              fontSize="9.5"
              fontFamily={FM}
            >
              {d.label}
            </text>
          </g>
        );
      })()}

      {legend !== "none" && (
        <g transform={`translate(${pad}, ${size - 8})`}>
          {legend !== "tomorrow" && (
            <>
              <circle cx="4" cy="-3" r="4.4" fill="none" stroke={C.today} strokeWidth="1.7" />
              <text x="13" y="0" fill={C.t3} fontSize="8.5" fontFamily={FB}>
                Today
              </text>
            </>
          )}
          {legend !== "today" && (
            <>
              <circle cx={legend === "tomorrow" ? 4 : 62} cy="-3" r="4.5" fill={C.target} />
              <text x={legend === "tomorrow" ? 13 : 71} y="0" fill={C.t3} fontSize="8.5" fontFamily={FB}>
                Tomorrow
              </text>
            </>
          )}
        </g>
      )}
    </svg>
  );
}
