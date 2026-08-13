import { C, DISPLAY_TRACKING, DISPLAY_WEIGHT, FD } from "@/lib/theme";

/** The participant-facing page frame, ported from the reference prototype. */
export function Shell({ subtitle, children }: { subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 16px" }}>
      <div style={{ maxWidth: "660px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.t3,
              margin: "0 0 10px",
            }}
          >
            The Signal Workshop · EMC · Enovos NEXT
          </p>
          <h1
            style={{
              fontFamily: FD,
              fontSize: "38px",
              fontWeight: DISPLAY_WEIGHT,
              letterSpacing: DISPLAY_TRACKING,
              color: C.text,
              margin: "0 0 8px",
              lineHeight: 1.05,
            }}
          >
            Cultural Compass
          </h1>
          {subtitle && (
            <p style={{ fontSize: "14px", color: C.t2, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
