import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import SWRegistrar from "@/components/shared/SWRegistrar";
import OfflineBanner from "@/components/shared/OfflineBanner";
import AchievementToastProvider from "@/components/ui/AchievementToast";
import InstallPrompt from "@/components/InstallPrompt";
import { ToastProvider } from "@/components/Toast";
import { XPAnimation } from "@/components/XPAnimation";
import { AppleMeta } from "@/components/AppleMeta";

export const metadata: Metadata = {
  title: "FORC3 — AI Hybrid Athlete Coaching App",
  description:
    "PhD-Level coaching at app prices. AI that reads your training data and builds a personalized plan for any goal — strength, marathon, hybrid, and more.",
  keywords:
    "fitness app, AI coach, hybrid athlete, training plan, marathon training, workout tracker, strength training, nutrition tracking",
  icons: { icon: "/favicon.ico", apple: "/icon-192.png" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FORC3",
  },
  formatDetection: { telephone: false },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "FORC3",
    "msapplication-TileColor": "#000000",
    "msapplication-tap-highlight": "none",
  },
  openGraph: {
    title: "FORC3 — AI Athlete Coach",
    description:
      "The AI coach that actually reads your health data. Adapts your training daily. Knows when to push and when to back off.",
    url: "https://forc3.app",
    siteName: "FORC3",
    type: "website",
    images: [
      {
        url: "https://forc3.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "FORC3 — AI Hybrid Athlete Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FORC3 — AI Athlete Coach",
    description: "PhD-Level coaching at app prices.",
    images: ["https://forc3.app/og-image.png"],
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
      <head>
        <AppleMeta />
      </head>
      <body className="bg-black text-white antialiased">
        <SWRegistrar />
        <OfflineBanner />
        <ToastProvider>
          <AchievementToastProvider />
          <XPAnimation />
          <InstallPrompt />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
