import Link from "next/link";
import { C, FB } from "@/lib/theme";

/** The two admin screens, each carrying the key forward. */
export function AdminNav({ adminKey, current }: { adminKey: string; current: "items" | "sessions" }) {
  const tabs = [
    { id: "items", label: "Items", href: `/admin?k=${encodeURIComponent(adminKey)}` },
    { id: "sessions", label: "Sessions", href: `/admin/sessions?k=${encodeURIComponent(adminKey)}` },
  ] as const;

  return (
    <nav style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
      {tabs.map((t) => {
        const on = t.id === current;
        return (
          <Link
            key={t.id}
            href={t.href}
            style={{
              minHeight: "36px",
              display: "inline-flex",
              alignItems: "center",
              padding: "0 16px",
              borderRadius: "8px",
              border: `1px solid ${on ? C.accent : C.border}`,
              background: on ? C.accent : C.surface,
              color: on ? "#fff" : C.t2,
              fontSize: "14px",
              fontWeight: on ? 600 : 500,
              fontFamily: FB,
              textDecoration: "none",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
