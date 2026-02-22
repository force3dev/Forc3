import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import SWRegistrar from "@/components/shared/SWRegistrar";
import OfflineBanner from "@/components/shared/OfflineBanner";
import AchievementToastProvider from "@/components/ui/AchievementToast";

export const metadata: Metadata = {
  title: "FORC3 — PhD-Level Coaching at App Prices",
  description: "The personal trainer that actually knows the science — and learns you.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black text-white antialiased">
        <SWRegistrar />
        <OfflineBanner />
        <AchievementToastProvider />
        {children}
      </body>
    </html>
  );
}
