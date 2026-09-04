"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { C, DISPLAY_TRACKING, DISPLAY_WEIGHT, FB, FD } from "@/lib/theme";

/**
 * The admin pages are reached from a link that cannot carry the key, so they
 * ask for it rather than 404-ing. The wording never distinguishes "no key" from
 * "wrong key", and the key still travels as `?k=` exactly as the results screen
 * does — this form is a way in, not a second security model.
 */
export function AdminKeyPrompt({ path, wrong }: { path: string; wrong: boolean }) {
  const router = useRouter();
  const [key, setKey] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "60px 16px" }}>
      <div style={{ maxWidth: "440px", margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: FD,
            fontSize: "28px",
            fontWeight: DISPLAY_WEIGHT,
            letterSpacing: DISPLAY_TRACKING,
            color: C.text,
            margin: "0 0 8px",
          }}
        >
          Admin
        </h1>
        <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: "0 0 20px" }}>
          {wrong
            ? "That key was not accepted."
            : "Enter the admin key to edit the items or review past sessions."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (key.trim()) router.push(`${path}?k=${encodeURIComponent(key.trim())}`);
          }}
        >
          <input
            type="password"
            value={key}
            autoFocus
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            style={{
              width: "100%",
              minHeight: "48px",
              padding: "12px 14px",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              fontSize: "15px",
              fontFamily: FB,
              color: C.text,
              background: C.surface,
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              minHeight: "48px",
              marginTop: "12px",
              borderRadius: "9px",
              border: "none",
              background: C.accent,
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: FB,
              cursor: "pointer",
            }}
          >
            Open
          </button>
        </form>
      </div>
    </div>
  );
}
