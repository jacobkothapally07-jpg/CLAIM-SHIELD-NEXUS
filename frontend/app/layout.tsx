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
    <html lang="en">
      <body className="antialiased bg-[#f2fcff] text-[#042126] selection:bg-[#acf2e5] selection:text-[#042126] font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
