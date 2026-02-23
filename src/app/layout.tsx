import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import SWRegistrar from "@/components/shared/SWRegistrar";
import OfflineBanner from "@/components/shared/OfflineBanner";
import AchievementToastProvider from "@/components/ui/AchievementToast";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "FORC3 — PhD-Level Coaching at App Prices",
  description: "The personal trainer that actually knows the science — and learns you.",
  icons: { icon: "/favicon.ico", apple: "/icon-192.png" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FORC3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black text-white antialiased">
        <SWRegistrar />
        <OfflineBanner />
        <AchievementToastProvider />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
