import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

// Self-hosted at build time — nothing to fetch from Google on conference wifi.
// DM Sans carries headings as well as body copy; the italic face is loaded for
// the world taglines so they are not synthesised obliques.
const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cultural Compass",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F2ED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
