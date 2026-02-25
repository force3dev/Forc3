'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface BarcodeScannerProps {
  onDetect: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetect, onClose }: BarcodeScannerProps) {
  const [code, setCode] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-white text-2xl">
        &#x2715;
      </button>
      <div className="text-6xl mb-6">
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8h.01M7 12h.01M7 16h.01M11 8h2M11 12h2M11 16h2M17 8h.01M17 12h.01M17 16h.01" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Scan Barcode</h2>
      <p className="text-gray-400 text-sm mb-6 text-center">Enter a barcode number to look up nutrition info</p>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Enter barcode number..."
        className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white text-center text-lg tracking-wider focus:outline-none focus:border-green-500"
        inputMode="numeric"
        autoFocus
      />
      <button
        onClick={() => code.trim() && onDetect(code.trim())}
        disabled={!code.trim()}
        className="mt-4 w-full max-w-sm bg-green-500 disabled:opacity-40 text-black font-bold py-3 rounded-2xl transition-opacity"
      >
        Look Up
      </button>
    </motion.div>
  )
}
