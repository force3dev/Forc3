"use client";

import { useEffect, useRef, useState } from "react";

type FoodResult = {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
};

type BarcodeScannerProps = {
  onResult: (food: FoodResult) => void;
  onClose: () => void;
};

type ScanState = "idle" | "scanning" | "loading" | "found" | "not_found" | "error" | "no_camera";

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [food, setFood] = useState<FoodResult | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManual, setShowManual] = useState(false);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState("scanning");
        startScanning();
      }
    } catch {
      setState("no_camera");
    }
  }

  function stopCamera() {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  function startScanning() {
    // Use BarcodeDetector if available (Chrome Android)
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });

      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || state === "loading") return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            await lookupBarcode(code);
          }
        } catch {/* continue scanning */}
      }, 500);
    }
    // Fallback: canvas-based frame capture for ZXing (if loaded)
  }

  async function lookupBarcode(barcode: string) {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setState("loading");

    try {
      const res = await fetch(`/api/nutrition/barcode?upc=${barcode}`);
      if (!res.ok) {
        setState("not_found");
        return;
      }
      const data = await res.json();
      if (data.food) {
        setFood(data.food);
        setState("found");
      } else {
        setState("not_found");
      }
    } catch {
      setState("error");
    }
  }

  async function handleManualLookup() {
    if (!/^\d{8,14}$/.test(manualBarcode)) return;
    await lookupBarcode(manualBarcode);
  }

  function reset() {
    setFood(null);
    setManualBarcode("");
    setShowManual(false);
    setState("scanning");
    startScanning();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <h2 className="text-lg font-bold">Scan Barcode</h2>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400"
        >
          ✕
        </button>
      </div>

      {/* Camera View */}
      {(state === "scanning" || state === "idle") && (
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scan overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-40 relative">
              {/* Corner borders */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#0066FF] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#0066FF] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#0066FF] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0066FF] rounded-br-lg" />
              {/* Scan line */}
              <div className="absolute left-2 right-2 h-0.5 bg-[#0066FF] opacity-80 animate-scan-line" style={{ top: "50%" }} />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="absolute bottom-8 left-0 right-0 text-center text-sm text-white/60">
            Point camera at barcode
          </p>
        </div>
      )}

      {/* Loading */}
      {state === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Looking up product...</p>
        </div>
      )}

      {/* Found */}
      {state === "found" && food && (
        <div className="flex-1 flex flex-col p-5 gap-4">
          <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
            <div className="flex gap-4 items-start mb-4">
              {food.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={food.image} alt={food.name} className="w-16 h-16 rounded-xl object-cover bg-[#1a1a1a]" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base">{food.name}</p>
                {food.brand && <p className="text-sm text-neutral-400">{food.brand}</p>}
                <p className="text-xs text-neutral-500 mt-1">{food.servingSize}</p>
              </div>
            </div>
            {/* Macros */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Calories", value: food.calories, unit: "kcal", color: "#fff" },
                { label: "Protein", value: food.protein, unit: "g", color: "#0066FF" },
                { label: "Carbs", value: food.carbs, unit: "g", color: "#f59e0b" },
                { label: "Fat", value: food.fat, unit: "g", color: "#ef4444" },
              ].map(m => (
                <div key={m.label} className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <p className="text-xs text-neutral-500">{m.label}</p>
                  <p className="text-base font-bold mt-1" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-xs text-neutral-600">{m.unit}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { stopCamera(); onResult(food); }}
            className="w-full py-3.5 bg-[#0066FF] rounded-2xl text-sm font-semibold"
          >
            Add to Log
          </button>
          <button onClick={reset} className="w-full py-3 text-neutral-400 text-sm">
            Scan Another
          </button>
        </div>
      )}

      {/* Not Found */}
      {(state === "not_found" || state === "error") && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5">
          <div className="text-4xl">🔍</div>
          <p className="text-neutral-300 font-medium">Product not found</p>
          <p className="text-neutral-500 text-sm text-center">
            This product is not in our database yet.
          </p>
          <button onClick={reset} className="w-full py-3 bg-[#1a1a1a] rounded-2xl text-sm font-medium text-neutral-300">
            Try Again
          </button>
          <button
            onClick={() => setShowManual(true)}
            className="text-[#0066FF] text-sm"
          >
            Enter barcode manually
          </button>
        </div>
      )}

      {/* No Camera */}
      {state === "no_camera" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5">
          <div className="text-4xl">📷</div>
          <p className="text-neutral-300 font-medium">Camera not available</p>
          <p className="text-neutral-500 text-sm text-center">
            Please allow camera access or enter the barcode manually.
          </p>
          <button
            onClick={() => setShowManual(true)}
            className="w-full py-3 bg-[#0066FF] rounded-2xl text-sm font-semibold"
          >
            Enter Barcode Manually
          </button>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManual && (
        <div className="absolute inset-0 bg-black/80 flex items-end">
          <div className="w-full bg-[#141414] rounded-t-3xl p-6 space-y-4">
            <h3 className="text-base font-bold">Enter Barcode</h3>
            <input
              type="number"
              placeholder="e.g. 012345678901"
              value={manualBarcode}
              onChange={e => setManualBarcode(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0066FF]"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowManual(false)}
                className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-sm text-neutral-400"
              >
                Cancel
              </button>
              <button
                onClick={handleManualLookup}
                disabled={!/^\d{8,14}$/.test(manualBarcode)}
                className="flex-1 py-3 bg-[#0066FF] rounded-xl text-sm font-semibold disabled:opacity-40"
              >
                Look Up
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(-50%); opacity: 1; }
          50% { transform: translateY(50%); opacity: 0.5; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
