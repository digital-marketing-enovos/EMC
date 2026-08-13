"use client";

import { useState } from "react";
import { C, FB, FM } from "@/lib/theme";
import { Shell } from "@/components/Shell";

type Created = { code: string; secret: string; title: string };

const card = {
  background: C.surface,
  borderRadius: "12px",
  border: `1px solid ${C.border}`,
  padding: "24px",
  marginBottom: "14px",
} as const;

const label = {
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: C.t3,
  marginBottom: "8px",
} as const;

export default function FacilitatorHome() {
  const [title, setTitle] = useState("EMC — Cultural Compass");
  const [session, setSession] = useState<Created | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<Created> & { error?: string };
      if (!res.ok || !body.code || !body.secret) {
        setError(body.error ?? "Could not create the session.");
        return;
      }
      setSession({ code: body.code, secret: body.secret, title: body.title ?? title });
    } catch {
      setError("Could not create the session.");
    } finally {
      setBusy(false);
    }
  }

  if (session) return <CreatedPanel session={session} />;

  return (
    <Shell subtitle="Facilitator · create a session">
      <div style={card}>
        <div style={label}>Session title</div>
        <input
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            minHeight: "48px",
            padding: "12px 14px",
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "15px",
            fontFamily: FB,
            color: C.text,
            background: C.bg,
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p role="alert" style={{ fontSize: "13px", color: C.fire, margin: "12px 0 0" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={create}
          disabled={busy}
          style={{
            width: "100%",
            minHeight: "52px",
            marginTop: "16px",
            borderRadius: "10px",
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: "15px",
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
            fontFamily: FB,
          }}
        >
          {busy ? "Creating…" : "Create session"}
        </button>
      </div>
    </Shell>
  );
}

function CreatedPanel({ session }: { session: Created }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const joinUrl = `${origin}/s/${session.code}`;
  const presentUrl = `${origin}/s/${session.code}/present`;
  const resultsUrl = `${origin}/s/${session.code}/results?k=${session.secret}`;

  return (
    <Shell subtitle={session.title}>
      <div
        style={{
          ...card,
          borderColor: C.accent + "55",
          background: C.accent + "0A",
        }}
      >
        <div style={label}>Keep this tab open</div>
        <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: "0 0 4px" }}>
          The results link below is the only key to this session. It is shown once and is not
          recoverable — bookmark it now.
        </p>
      </div>

      <div style={card}>
        <div style={label}>Session code</div>
        <div style={{ fontFamily: FM, fontSize: "32px", color: C.text, letterSpacing: "0.06em" }}>
          {session.code}
        </div>
      </div>

      <LinkRow name="Join screen — project this" href={presentUrl} />
      <LinkRow name="Results — facilitator only" href={resultsUrl} />
      <LinkRow name="Participant link" href={joinUrl} />
    </Shell>
  );
}

function LinkRow({ name, href }: { name: string; href: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={card}>
      <div style={label}>{name}</div>
      <a
        href={href}
        style={{
          fontFamily: FM,
          fontSize: "13px",
          color: C.accent,
          wordBreak: "break-all",
          lineHeight: 1.6,
          display: "block",
          marginBottom: "12px",
        }}
      >
        {href}
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
        style={{
          minHeight: "40px",
          padding: "0 16px",
          borderRadius: "8px",
          border: `1px solid ${C.border}`,
          background: C.bg,
          color: C.t2,
          fontSize: "13px",
          fontFamily: FB,
          cursor: "pointer",
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
