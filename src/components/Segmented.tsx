"use client";

import { C, FB } from "@/lib/theme";

/** Ported from the reference prototype. `scale` enlarges it for the projector. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  scale = 1,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
  label?: string;
  scale?: number;
  /** Lets the stylesheet switch the group between a row and a column. */
  className?: string;
}) {
  const px = (v: number) => `${v * scale}px`;
  return (
    <div>
      {label && (
        <div
          style={{
            fontSize: px(9),
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.t3,
            marginBottom: px(7),
          }}
        >
          {label}
        </div>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        className={className}
        style={{
          display: "inline-flex",
          background: C.bg,
          borderRadius: px(9),
          padding: px(3),
          gap: px(3),
          border: `${Math.max(1.5, scale)}px solid ${C.border}`,
        }}
      >
        {options.map(([v, l]) => {
          const on = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(v)}
              style={{
                padding: `${px(7)} ${px(14)}`,
                minHeight: px(30),
                borderRadius: px(7),
                border: "none",
                background: on ? C.accent : "transparent",
                color: on ? "#fff" : C.t2,
                fontSize: px(12),
                fontWeight: on ? 600 : 500,
                cursor: "pointer",
                fontFamily: FB,
                transition: "all .15s",
                whiteSpace: "nowrap",
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
