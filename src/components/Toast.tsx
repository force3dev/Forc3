'use client'

import { createContext, useContext, useCallback, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'info' | 'warning' | 'error'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TYPE_STYLES: Record<ToastType, { border: string; icon: string }> = {
  success: { border: 'border-[#00C853]/40', icon: '✅' },
  info:    { border: 'border-[#0066FF]/40', icon: 'ℹ️' },
  warning: { border: 'border-[#FFB300]/40', icon: '⚠️' },
  error:   { border: 'border-red-500/40',   icon: '❌' },
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const styles = TYPE_STYLES[item.type]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      onClick={onDismiss}
      className={`flex items-center gap-3 bg-[#1a1a1a] border ${styles.border} rounded-2xl px-4 py-3 shadow-xl cursor-pointer`}
    >
      <span>{styles.icon}</span>
      <span className="text-sm font-medium text-white flex-1">{item.message}</span>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 2500) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type, duration }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])
  const info    = useCallback((msg: string) => toast(msg, 'info'), [toast])
  const warning = useCallback((msg: string) => toast(msg, 'warning'), [toast])
  const error   = useCallback((msg: string) => toast(msg, 'error'), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, info, warning, error }}>
      {children}
      <div className="fixed bottom-24 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem item={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
