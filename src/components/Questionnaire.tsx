"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Item, type Kind, type Raw } from "@/lib/items";
import type { Answers, Point } from "@/lib/scoring";
import { C, FB } from "@/lib/theme";
import { ItemCard } from "./ItemCard";
import { PersonalResult } from "./PersonalResult";

const LABEL_MAX = 12;

type Draft = { today: Record<number, Raw>; target: Record<number, Raw>; label: string };
type Submitted = { id: string; today: Point; target: Point };

const draftKey = (code: string) => `cc:draft:${code}`;
const doneKey = (code: string) => `cc:response:${code}`;

function readStore<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStore(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode with no storage quota: the questionnaire still works,
    // it just will not survive a refresh.
  }
}

export function Questionnaire({
  code,
  closed,
  items,
}: {
  code: string;
  closed: boolean;
  /** The twelve items, already in display order, wording resolved server-side. */
  items: Item[];
}) {
  // `null` while sessionStorage is being read — avoids a flash of empty form.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubmitted(readStore<Submitted>(doneKey(code)));
    setDraft(readStore<Draft>(draftKey(code)) ?? { today: {}, target: {}, label: "" });
  }, [code]);

  const update = useCallback(
    (fn: (d: Draft) => Draft) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        writeStore(draftKey(code), next);
        return next;
      });
    },
    [code],
  );

  const onAnswer = useCallback(
    (id: number, kind: Kind, v: Raw) => update((d) => ({ ...d, [kind]: { ...d[kind], [id]: v } })),
    [update],
  );

  const total = items.length * 2;
  const done = draft ? Object.keys(draft.today).length + Object.keys(draft.target).length : 0;
  const pct = (done / total) * 100;
  const complete = done === total;

  const firstUnanswered = useMemo(() => {
    if (!draft) return null;
    const idx = items.findIndex(
      (i) => draft.today[i.id] === undefined || draft.target[i.id] === undefined,
    );
    return idx < 0 ? null : items[idx].id;
  }, [draft, items]);

  async function submit() {
    if (!draft || !complete || sending) return;
    setSending(true);
    setError(null);

    const answers: Answers = {};
    for (const item of items) {
      answers[String(item.id)] = { today: draft.today[item.id], target: draft.target[item.id] };
    }

    try {
      const res = await fetch(`/api/s/${encodeURIComponent(code)}/responses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers, label: draft.label.trim() || null }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        today?: Point;
        target?: Point;
        error?: string;
      };
      if (!res.ok || !body.id || !body.today || !body.target) {
        setError(body.error ?? "Could not send your answers. Check your connection and try again.");
        return;
      }
      const saved: Submitted = { id: body.id, today: body.today, target: body.target };
      writeStore(doneKey(code), saved);
      setSubmitted(saved);
      window.scrollTo({ top: 0 });
    } catch {
      setError("Could not send your answers. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) return <PersonalResult today={submitted.today} target={submitted.target} />;
  if (!draft) return null;

  if (closed) {
    return (
      <div
        style={{
          background: C.surface,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          padding: "22px 24px",
        }}
      >
        <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: 0 }}>
          This session is closed. Speak to the facilitator.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: C.bg,
          paddingTop: "6px",
          paddingBottom: "14px",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: C.t2 }}>
            {done} / {total} positions
          </span>
          <span style={{ fontSize: "12px", color: C.t2 }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: "2px", background: C.border, borderRadius: "1px" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: C.accent,
              borderRadius: "1px",
              transition: "width .3s",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          padding: "18px 20px",
          marginBottom: "16px",
        }}
      >
        <p style={{ fontSize: "13.5px", color: C.t2, lineHeight: 1.7, margin: 0 }}>
          Twelve trade-offs. Both options are defensible — there is no right answer, only a priority.
          Position yourself <strong style={{ color: C.text }}>twice</strong> on each: where Enovos stands{" "}
          <strong style={{ color: C.text }}>today</strong>, and where Enovos must stand{" "}
          <strong style={{ color: C.text }}>tomorrow</strong> for NEXT to succeed.
        </p>
      </div>

      {items.map((item, i) => (
        <div key={item.id} id={`item-${item.id}`}>
          <ItemCard
            item={item}
            idx={i}
            today={draft.today[item.id]}
            target={draft.target[item.id]}
            onAnswer={onAnswer}
          />
        </div>
      ))}

      <div
        style={{
          background: C.surface,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          padding: "16px 20px",
          marginBottom: "12px",
        }}
      >
        <label
          htmlFor="cc-label"
          style={{
            display: "block",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.t3,
            marginBottom: "8px",
          }}
        >
          Initials — optional
        </label>
        <input
          id="cc-label"
          value={draft.label}
          maxLength={LABEL_MAX}
          onChange={(e) => update((d) => ({ ...d, label: e.target.value }))}
          placeholder="Leave blank to stay anonymous"
          style={{
            width: "100%",
            minHeight: "44px",
            padding: "10px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: FB,
            color: C.text,
            background: C.bg,
            boxSizing: "border-box",
          }}
        />
        <p style={{ fontSize: "11px", color: C.t3, margin: "8px 0 0", lineHeight: 1.6 }}>
          Only so the facilitator can point at your dot during the debrief. Nothing else is collected.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: "13px",
            color: C.fire,
            background: C.fire + "12",
            border: `1px solid ${C.fire}33`,
            borderRadius: "8px",
            padding: "12px 14px",
            margin: "0 0 12px",
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          if (complete) return submit();
          if (firstUnanswered !== null) {
            document.getElementById(`item-${firstUnanswered}`)?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }}
        style={{
          width: "100%",
          minHeight: "52px",
          padding: "15px",
          borderRadius: "10px",
          border: "none",
          background: complete ? C.accent : C.border,
          color: complete ? "#fff" : C.t2,
          fontSize: "15px",
          fontWeight: 600,
          cursor: sending ? "wait" : "pointer",
          marginTop: "8px",
          marginBottom: "32px",
          fontFamily: FB,
          transition: "background .2s",
        }}
      >
        {sending
          ? "Sending…"
          : complete
            ? "See my compass →"
            : `${total - done} position${total - done > 1 ? "s" : ""} left`}
      </button>
    </div>
  );
}
