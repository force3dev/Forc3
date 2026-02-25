"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import BottomNav from "@/components/shared/BottomNav";

const TOOLS = [
  {
    title: "Macro Calculator",
    description: "Calculate your daily calories, protein, carbs & fat based on your goals",
    href: "/tools/macros",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: "#00C853",
  },
  {
    title: "Pace Calculator",
    description: "Find your running pace, splits & training zones for any distance",
    href: "/tools/pace",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "#FFB300",
  },
  {
    title: "1RM Calculator",
    description: "Estimate your one-rep max with warmup protocol & history tracking",
    href: "/tools/1rm",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h2m0 0V4m0 2v2M3 6h18m-2 0V4m0 2v2m0-2h2M5 8h14m-7 4v4m0-4H9m3 0h3" />
      </svg>
    ),
    color: "#0066FF",
  },
  {
    title: "Plate Calculator",
    description: "Figure out exactly which plates to load on the bar",
    href: "/tools/plate-calculator",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="5" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="1.5" strokeWidth={1.5} />
      </svg>
    ),
    color: "#E040FB",
  },
  {
    title: "Body Fat Calculator",
    description: "Estimate body fat % using the U.S. Navy circumference method",
    href: "/tools/body-fat",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "#FF5252",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function ToolsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#141414] border border-[#262626] text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Tools</h1>
              <p className="text-xs text-neutral-500">Calculators & utilities</p>
            </div>
          </div>
          <span className="text-xs font-black tracking-[0.2em] text-[#0066FF]">FORC3</span>
        </div>
      </header>

      {/* Tools Grid */}
      <motion.div
        className="px-5 pt-5 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {TOOLS.map((tool) => (
          <motion.div key={tool.title} variants={cardVariants}>
            <Link href={tool.href}>
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
                >
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">{tool.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{tool.description}</p>
                </div>
                <svg className="w-4 h-4 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Links */}
      <div className="px-5 mt-6">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">More</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/progress/analytics">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-center active:scale-[0.98] transition-transform">
              <span className="text-2xl">📊</span>
              <p className="text-xs font-semibold text-neutral-400 mt-2">Analytics</p>
            </div>
          </Link>
          <Link href="/progress/measurements">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-center active:scale-[0.98] transition-transform">
              <span className="text-2xl">📏</span>
              <p className="text-xs font-semibold text-neutral-400 mt-2">Measurements</p>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
