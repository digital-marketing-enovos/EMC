"use client";

import { useState } from "react";
import { AdminNav } from "./AdminNav";
import { C, DISPLAY_TRACKING, DISPLAY_WEIGHT, FB, FD, FM } from "@/lib/theme";

export type SessionRow = {
  code: string;
  secret: string;
  title: string;
  createdAt: string;
  closedAt: string | null;
  responseCount: number;
};

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function SessionsAdmin({ adminKey, initial }: { adminKey: string; initial: SessionRow[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(row: SessionRow) {
    const warning =
      row.responseCount > 0
        ? `Delete ${row.code} and its ${row.responseCount} response${row.responseCount > 1 ? "s" : ""}?\n\nThis cannot be undone. Export the CSV first if you may need the data.`
        : `Delete ${row.code}? It holds no responses.`;
    if (!window.confirm(warning)) return;

    setBusy(row.code);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/sessions/${encodeURIComponent(row.code)}?k=${encodeURIComponent(adminKey)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setError(`Could not delete ${row.code}.`);
        return;
      }
      setRows((rs) => rs.filter((r) => r.code !== row.code));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  const chip = {
    minHeight: "36px",
    display: "inline-flex",
    alignItems: "center",
    padding: "0 14px",
    borderRadius: "8px",
    border: `1px solid ${C.border}`,
    background: C.bg,
    fontSize: "13px",
    fontFamily: FB,
    textDecoration: "none",
    color: C.t2,
    cursor: "pointer",
  } as const;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 16px 80px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <AdminNav adminKey={adminKey} current="sessions" />

        <h1
          style={{
            fontFamily: FD,
            fontSize: "30px",
            fontWeight: DISPLAY_WEIGHT,
            letterSpacing: DISPLAY_TRACKING,
            color: C.text,
            margin: "0 0 8px",
          }}
        >
          Past sessions
        </h1>
        <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: "0 0 22px", maxWidth: "70ch" }}>
          Every session ever created, newest first. Opening the results does not need the link you
          were given at creation — it is reconstructed here. Deleting a session destroys its
          responses with it.
        </p>

        {error && (
          <p role="alert" style={{ fontSize: "14px", color: C.fire, margin: "0 0 14px" }}>
            {error}
          </p>
        )}

        {rows.length === 0 ? (
          <p style={{ fontSize: "14px", color: C.t3 }}>No sessions yet.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.code}
              style={{
                background: C.surface,
                borderRadius: "12px",
                border: `1px solid ${C.border}`,
                padding: "16px 20px",
                marginBottom: "10px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: FM, fontSize: "17px", color: C.text, fontWeight: 500 }}>
                    {row.code}
                  </span>
                  <span style={{ fontSize: "14px", color: C.t2 }}>{row.title}</span>
                  {row.closedAt && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: C.t3,
                        border: `1px solid ${C.border}`,
                        borderRadius: "999px",
                        padding: "2px 9px",
                      }}
                    >
                      closed
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "12.5px", color: C.t3, marginTop: "4px" }}>
                  {dateFmt.format(new Date(row.createdAt))} ·{" "}
                  <strong style={{ color: row.responseCount ? C.t2 : C.t3, fontFamily: FM }}>
                    {row.responseCount}
                  </strong>{" "}
                  {row.responseCount === 1 ? "response" : "responses"}
                </div>
              </div>

              <a
                href={`/s/${row.code}/results?k=${encodeURIComponent(row.secret)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={chip}
              >
                Results
              </a>
              <a
                href={`/api/s/${row.code}/export?k=${encodeURIComponent(row.secret)}`}
                style={chip}
              >
                CSV
              </a>
              <button
                type="button"
                onClick={() => remove(row)}
                disabled={busy === row.code}
                style={{ ...chip, color: C.fire, borderColor: C.fire + "55" }}
              >
                {busy === row.code ? "Deleting…" : "Delete"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
