import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/common/AppShell";

export const metadata: Metadata = {
  title: "ClaimShield Nexus | SIU Investigation Intelligence Platform",
  description:
    "AI-powered protection against fraudulent healthcare claims. From suspicious claims to evidence-backed investigations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#060911] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200 font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
