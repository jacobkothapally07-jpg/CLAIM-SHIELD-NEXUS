import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/common/AppShell";

export const metadata: Metadata = {
  title: "ClaimShield Nexus | SIU Investigation Intelligence Platform",
  description:
    "Multi-signal investigation intelligence for suspicious healthcare claims. Combines claim rules, anomaly detection, network intelligence, and temporal patterns for SIU investigators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#f2fcff] text-[#042126] selection:bg-[#acf2e5] selection:text-[#042126] font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
