"use client";

import { useMemo, useState } from "react";
import { DISPLAY_ORDER, ITEMS, type Item } from "@/lib/items";
import type { ItemText, ItemTextMap } from "@/lib/content";
import { C, DISPLAY_TRACKING, DISPLAY_WEIGHT, FB, FD, FM } from "@/lib/theme";
import { AdminNav } from "./AdminNav";
import { ItemCard } from "./ItemCard";

const POLE_NAME: Record<"X" | "Y", { low: string; high: string }> = {
  X: { low: "Collectivism", high: "Individualism" },
  Y: { low: "Integration", high: "Fragmentation" },
};

type Payload = { texts: ItemTextMap; overridden: number[] };

const card = {
  background: C.surface,
  borderRadius: "12px",
  border: `1px solid ${C.border}`,
  padding: "20px 22px",
  marginBottom: "14px",
} as const;

const legend = {
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: C.t3,
  marginBottom: "6px",
  display: "block",
} as const;

export function AdminEditor({
  adminKey,
  initialTexts,
  initialOverridden,
}: {
  adminKey: string;
  initialTexts: ItemTextMap;
  initialOverridden: number[];
}) {
  const [texts, setTexts] = useState<ItemTextMap>(initialTexts);
  const [saved, setSaved] = useState<ItemTextMap>(initialTexts);
  const [overridden, setOverridden] = useState<number[]>(initialOverridden);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const url = `/api/admin/items?k=${encodeURIComponent(adminKey)}`;

  const dirty = useMemo(
    () =>
      Object.keys(texts)
        .map(Number)
        .filter((id) => (["theme", "stem", "low", "high"] as const).some((f) => texts[id][f] !== saved[id][f])),
    [texts, saved],
  );

  function edit(id: number, field: keyof ItemText, value: string) {
    setTexts((t) => ({ ...t, [id]: { ...t[id], [field]: value } }));
    setNote(null);
  }

  async function apply(init: RequestInit, target: string, okNote: string) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(target, init);
      const body = (await res.json().catch(() => ({}))) as Partial<Payload> & { error?: string };
      if (!res.ok || !body.texts) {
        setError(body.error ?? "Could not save.");
        return;
      }
      setTexts(body.texts);
      setSaved(body.texts);
      setOverridden(body.overridden ?? []);
      setNote(okNote);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    apply(
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(dirty.map((id) => [id, texts[id]]))),
      },
      url,
      `Saved ${dirty.length} item${dirty.length > 1 ? "s" : ""}.`,
    );

  const resetOne = (id: number) => apply({ method: "DELETE" }, `${url}&id=${id}`, `Item ${id} restored.`);

  const resetAll = () => {
    if (!window.confirm("Restore the original wording of all twelve items?")) return;
    return apply({ method: "DELETE" }, url, "All wording restored.");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 16px 80px" }}>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <AdminNav adminKey={adminKey} current="items" />
        <header style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontFamily: FD,
              fontSize: "32px",
              fontWeight: DISPLAY_WEIGHT,
              letterSpacing: DISPLAY_TRACKING,
              color: C.text,
              margin: "0 0 8px",
            }}
          >
            Edit the twelve items
          </h1>
          <p style={{ fontSize: "14px", color: C.t2, margin: 0, lineHeight: 1.7, maxWidth: "70ch" }}>
            Wording only. The axis each item belongs to, its position in the display order and
            whether its poles are swapped on screen are fixed in code — they decide how an answer
            scores, and changing them here would silently rewrite coordinates already collected.
            Edits apply to participants who open the questionnaire from then on.
          </p>
        </header>

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: C.bg,
            padding: "10px 0 14px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
            borderBottom: `1px solid ${C.border}`,
            marginBottom: "18px",
          }}
        >
          <button
            type="button"
            onClick={save}
            disabled={busy || dirty.length === 0}
            style={{
              minHeight: "44px",
              padding: "0 20px",
              borderRadius: "9px",
              border: "none",
              background: dirty.length ? C.accent : C.border,
              color: dirty.length ? "#fff" : C.t2,
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: FB,
              cursor: dirty.length && !busy ? "pointer" : "default",
            }}
          >
            {busy ? "Saving…" : dirty.length ? `Save ${dirty.length} change${dirty.length > 1 ? "s" : ""}` : "Saved"}
          </button>
          <button
            type="button"
            onClick={resetAll}
            disabled={busy || overridden.length === 0}
            style={{
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "9px",
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: overridden.length ? C.t2 : C.t3,
              fontSize: "14px",
              fontFamily: FB,
              cursor: overridden.length && !busy ? "pointer" : "default",
            }}
          >
            Restore all defaults
          </button>
          {error && <span style={{ fontSize: "14px", color: C.fire }}>{error}</span>}
          {note && !error && <span style={{ fontSize: "14px", color: C.t2 }}>{note}</span>}
        </div>

        {DISPLAY_ORDER.map((id, position) => {
          const base = ITEMS.find((i) => i.id === id)!;
          const text = texts[id];
          const preview: Item = { ...base, ...text };
          const poles = POLE_NAME[base.axis];
          // Mirror the participant's card: the left-hand proposition first.
          const sides = base.flip
            ? ([
                ["high", `Left on the card — ${poles.high} pole`],
                ["low", `Right on the card — ${poles.low} pole`],
              ] as const)
            : ([
                ["low", `Left on the card — ${poles.low} pole`],
                ["high", `Right on the card — ${poles.high} pole`],
              ] as const);

          return (
            <div key={id} style={card}>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <span style={{ fontFamily: FM, fontSize: "13px", color: C.text, fontWeight: 700 }}>
                  {String(position + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: "11px", color: C.t3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  item {id} · axis {base.axis} · {base.flip ? "poles swapped on screen" : "poles in order"}
                </span>
                {overridden.includes(id) && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: C.accent,
                      border: `1px solid ${C.accent}55`,
                      borderRadius: "999px",
                      padding: "2px 10px",
                    }}
                  >
                    edited
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => resetOne(id)}
                  disabled={busy || !overridden.includes(id)}
                  style={{
                    marginLeft: "auto",
                    minHeight: "32px",
                    padding: "0 12px",
                    borderRadius: "7px",
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: overridden.includes(id) ? C.t2 : C.t3,
                    fontSize: "13px",
                    fontFamily: FB,
                    cursor: overridden.includes(id) && !busy ? "pointer" : "default",
                  }}
                >
                  Restore default
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: "22px",
                  alignItems: "start",
                }}
              >
                <div>
                  <label style={legend} htmlFor={`theme-${id}`}>
                    Title
                  </label>
                  <Field
                    id={`theme-${id}`}
                    value={text.theme}
                    onChange={(v) => edit(id, "theme", v)}
                    max={40}
                  />

                  <label style={{ ...legend, marginTop: "14px" }} htmlFor={`stem-${id}`}>
                    Statement
                  </label>
                  <Field
                    id={`stem-${id}`}
                    value={text.stem}
                    onChange={(v) => edit(id, "stem", v)}
                    max={400}
                    rows={3}
                  />

                  {sides.map(([field, label]) => (
                    <div key={field}>
                      <label style={{ ...legend, marginTop: "14px" }} htmlFor={`${field}-${id}`}>
                        {label}
                      </label>
                      <Field
                        id={`${field}-${id}`}
                        value={text[field]}
                        onChange={(v) => edit(id, field, v)}
                        max={400}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <span style={legend}>As the participant sees it</span>
                  <div style={{ pointerEvents: "none", opacity: 0.95 }}>
                    <ItemCard item={preview} idx={position} onAnswer={() => {}} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  id,
  value,
  onChange,
  max,
  rows,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  rows?: number;
}) {
  const style = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    fontSize: "14px",
    lineHeight: 1.5,
    fontFamily: FB,
    color: C.text,
    background: C.bg,
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
  };
  return rows ? (
    <textarea id={id} value={value} rows={rows} maxLength={max} onChange={(e) => onChange(e.target.value)} style={style} />
  ) : (
    <input id={id} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} style={{ ...style, minHeight: "44px" }} />
  );
}
