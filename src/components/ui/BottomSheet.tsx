'use client'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useEffect } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  height?: 'auto' | 'half' | 'full'
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, height = 'auto', title }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100) onClose()
  }

  const heightClass = height === 'full' ? 'h-[95dvh]' : height === 'half' ? 'h-[50dvh]' : 'max-h-[90dvh]'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDrag}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-950 rounded-t-[2rem] ${heightClass} overflow-hidden flex flex-col`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>
            {title && (
              <div className="px-5 pb-3 shrink-0">
                <h2 className="text-lg font-bold text-white">{title}</h2>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default BottomSheet
