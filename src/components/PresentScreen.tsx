"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { C, DISPLAY_TRACKING, DISPLAY_WEIGHT, FD, FM } from "@/lib/theme";
import { usePoll } from "@/lib/usePoll";

type State = { count: number; closed: boolean };

/**
 * Projected on a 1920×1080 beamer in a bright room: everything is large, the
 * QR code is the biggest thing on screen, and nothing that matters sits in the
 * bottom 15% of the viewport.
 */
export function PresentScreen({ code, title }: { code: string; title: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const joinUrl = origin ? `${origin}/s/${code}` : "";

  const { data } = usePoll<State>(`/api/s/${encodeURIComponent(code)}/state`);
  const count = data?.count ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // Heavy bottom padding pulls the whole block above the lowest 15% of
        // the screen, which the room's furniture and heads tend to eat.
        padding: "3vh 4vw 17vh",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "clamp(13px, 1.3vw, 20px)",
          fontWeight: 600,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: C.t2,
          margin: "0 0 1.4vh",
        }}
      >
        {title}
      </p>
      <h1
        style={{
          fontFamily: FD,
          fontSize: "clamp(36px, 4.6vw, 76px)",
          fontWeight: DISPLAY_WEIGHT,
          letterSpacing: DISPLAY_TRACKING,
          color: C.text,
          margin: "0 0 2.4vh",
          lineHeight: 1.02,
        }}
      >
        Cultural Compass
      </h1>

      <div
        style={{
          background: C.surface,
          border: `2px solid ${C.border}`,
          borderRadius: "20px",
          padding: "min(2.2vw, 26px)",
          lineHeight: 0,
        }}
      >
        {joinUrl ? (
          <QRCodeSVG
            value={joinUrl}
            size={420}
            level="M"
            marginSize={0}
            bgColor={C.surface}
            fgColor={C.text}
            style={{ width: "min(30vh, 28vw)", height: "min(30vh, 28vw)" }}
          />
        ) : (
          <div style={{ width: "min(30vh, 28vw)", height: "min(30vh, 28vw)" }} />
        )}
      </div>

      <p
        style={{
          fontFamily: FM,
          fontSize: "clamp(18px, 2.1vw, 36px)",
          color: C.text,
          margin: "2.4vh 0 0.8vh",
          wordBreak: "break-all",
        }}
      >
        {joinUrl || " "}
      </p>
      <p
        style={{
          fontSize: "clamp(14px, 1.4vw, 22px)",
          color: C.t2,
          margin: 0,
        }}
      >
        Session code <strong style={{ fontFamily: FM, color: C.text }}>{code}</strong>
      </p>

      <div
        style={{
          marginTop: "2.6vh",
          display: "flex",
          alignItems: "baseline",
          gap: "0.8vw",
        }}
      >
        <span
          style={{
            fontFamily: FM,
            fontSize: "clamp(40px, 5vw, 84px)",
            fontWeight: 500,
            color: C.accent,
            lineHeight: 1,
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontSize: "clamp(15px, 1.6vw, 26px)",
            color: C.t2,
            letterSpacing: "0.06em",
          }}
        >
          {count === 1 ? "response in" : "responses in"}
        </span>
      </div>

      {data?.closed && (
        <p
          style={{
            marginTop: "1.6vh",
            fontSize: "clamp(14px, 1.4vw, 22px)",
            color: C.fire,
            fontWeight: 600,
          }}
        >
          Session closed
        </p>
      )}
    </div>
  );
}
