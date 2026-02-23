"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  type BeforeInstallPromptEvent = Event & { prompt(): void; userChoice: Promise<{ outcome: string }> };
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only show on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Already dismissed
    if (localStorage.getItem("forc3_install_dismissed")) return;

    // Already running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setShow(true);
      return;
    }

    // Android — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("forc3_install_dismissed", "1");
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") dismiss();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-[#141414] border border-[#0066FF]/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">📱</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Add FORC3 to your home screen</p>
            {isIOS ? (
              <p className="text-xs text-neutral-400 mt-0.5">
                Tap <span className="text-[#0066FF]">Share</span> → <span className="text-[#0066FF]">Add to Home Screen</span>
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mt-0.5">Get the full app experience 📲</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isIOS && deferredPrompt && (
              <button
                onClick={install}
                className="text-xs bg-[#0066FF] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0052CC] transition-colors"
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              className="text-neutral-500 hover:text-neutral-300 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
