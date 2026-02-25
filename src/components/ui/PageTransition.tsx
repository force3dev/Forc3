'use client'
import { motion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-30%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="min-h-dvh"
    >
      {children}
    </motion.div>
  )
}

export function SlideUpTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-0 bg-black z-30"
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
