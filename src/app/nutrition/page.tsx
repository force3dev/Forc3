'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { format, addDays, subDays } from 'date-fns'
import BottomNav from '@/components/shared/BottomNav'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FoodSearchModal } from '@/components/nutrition/FoodSearchModal'
import { BarcodeScanner } from '@/components/nutrition/BarcodeScanner'
import { haptics } from '@/lib/haptics'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: number
  servingUnit: string
  meal: string
  source: string
}

interface TodayData {
  foods: FoodItem[]
  totals: { calories: number; protein: number; carbs: number; fat: number }
}

interface Targets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

type MealSection = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const MEAL_META: Record<MealSection, { label: string; icon: string }> = {
  breakfast: { label: 'Breakfast', icon: 'M' },
  lunch:     { label: 'Lunch',     icon: 'L' },
  dinner:    { label: 'Dinner',    icon: 'D' },
  snack:     { label: 'Snacks',    icon: 'S' },
}

const MEAL_ICONS: Record<MealSection, React.ReactNode> = {
  breakfast: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  lunch: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  dinner: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  snack: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
}

const WATER_GOAL_ML = 2400 // 8 glasses of 300ml

// ─── Fetcher ────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

// ─── Calorie Ring ───────────────────────────────────────────────────────────

function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = Math.min(100, target > 0 ? (consumed / target) * 100 : 0)
  const r = 60
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - pct / 100)
  const remaining = Math.max(0, target - consumed)
  const isOver = consumed > target

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#1a1a1a" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke={isOver ? '#EF4444' : '#0066FF'}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white tabular-nums">{Math.round(consumed)}</span>
          <span className="text-xs text-neutral-500">kcal</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        {isOver ? (
          <span className="text-sm font-semibold text-red-400">
            {Math.round(consumed - target)} over
          </span>
        ) : (
          <span className="text-sm font-semibold text-[#0066FF]">
            {Math.round(remaining)} remaining
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Macro Donut ────────────────────────────────────────────────────────────

function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const pCal = protein * 4
  const cCal = carbs * 4
  const fCal = fat * 9
  const total = pCal + cCal + fCal || 1

  const pPct = (pCal / total) * 100
  const cPct = (cCal / total) * 100
  const fPct = (fCal / total) * 100

  return (
    <div className="flex items-center gap-4 mt-4">
      <svg viewBox="0 0 42 42" className="w-24 h-24 -rotate-90">
        <circle cx="21" cy="21" r="16" fill="none" stroke="#1f2937" strokeWidth="6"/>
        <circle cx="21" cy="21" r="16" fill="none" stroke="#3b82f6" strokeWidth="6"
          strokeDasharray={`${pPct} ${100-pPct}`} strokeDashoffset="0"/>
        <circle cx="21" cy="21" r="16" fill="none" stroke="#eab308" strokeWidth="6"
          strokeDasharray={`${cPct} ${100-cPct}`} strokeDashoffset={`${-pPct}`}/>
        <circle cx="21" cy="21" r="16" fill="none" stroke="#f97316" strokeWidth="6"
          strokeDasharray={`${fPct} ${100-fPct}`} strokeDashoffset={`${-(pPct+cPct)}`}/>
      </svg>
      <div className="space-y-1 text-xs">
        <p className="text-blue-400">Protein: {Math.round(pPct)}%</p>
        <p className="text-yellow-400">Carbs: {Math.round(cPct)}%</p>
        <p className="text-orange-400">Fat: {Math.round(fPct)}%</p>
      </div>
    </div>
  )
}

// ─── Macro Bar ──────────────────────────────────────────────────────────────

function MacroBar({
  label, value, target, color,
}: {
  label: string; value: number; target: number; color: string
}) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        <span className="text-xs text-neutral-400 tabular-nums">
          {Math.round(value)}g / {Math.round(target)}g
        </span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Meal Section Block ─────────────────────────────────────────────────────

function MealSectionBlock({
  section, foods, onDelete, onAdd,
}: {
  section: MealSection
  foods: FoodItem[]
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  const [open, setOpen] = useState(true)
  const { label } = MEAL_META[section]
  const sectionCals = foods.reduce((s, f) => s + f.calories, 0)

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
      <button
        onClick={() => { haptics.selection(); setOpen(o => !o) }}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-neutral-400">
            {MEAL_ICONS[section]}
          </div>
          <div className="text-left">
            <span className="font-semibold text-sm text-white">{label}</span>
            <span className="text-xs text-neutral-600 ml-2">{foods.length} item{foods.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white tabular-nums">{Math.round(sectionCals)}</span>
          <span className="text-[10px] text-neutral-500">kcal</span>
          <svg
            className={`w-3 h-3 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1a1a1a]">
              {foods.map(food => (
                <div key={food.id} className="px-4 py-3 flex items-center justify-between border-b border-[#1a1a1a] last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-white truncate">{food.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {food.quantity > 1 && `${food.quantity}x `}
                      {food.protein > 0 && `${Math.round(food.protein)}g P`}
                      {food.carbs > 0 && ` / ${Math.round(food.carbs)}g C`}
                      {food.fat > 0 && ` / ${Math.round(food.fat)}g F`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="font-semibold tabular-nums text-white">{Math.round(food.calories)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); haptics.light(); onDelete(food.id) }}
                      className="text-neutral-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add food button */}
              <button
                onClick={onAdd}
                className="w-full px-4 py-2.5 flex items-center gap-2 text-[#0066FF] text-sm font-medium hover:bg-[#0066FF]/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add food
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Water Tracker ──────────────────────────────────────────────────────────

function WaterTracker({ selectedDate }: { selectedDate: string }) {
  const [waterMl, setWaterMl] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem(`forc3_water_${selectedDate}`)
    if (saved) setWaterMl(parseInt(saved))
    else setWaterMl(0)
  }, [selectedDate])

  function addWater(amount: number) {
    haptics.light()
    const newTotal = waterMl + amount
    setWaterMl(newTotal)
    localStorage.setItem(`forc3_water_${selectedDate}`, String(newTotal))
  }

  const glasses = Math.floor(waterMl / 300)
  const pct = Math.min(100, (waterMl / WATER_GOAL_ML) * 100)

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0066FF]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Water</div>
            <div className="text-xs text-neutral-500">{(waterMl / 1000).toFixed(1)}L / {(WATER_GOAL_ML / 1000).toFixed(1)}L</div>
          </div>
        </div>
        <span className="text-sm font-bold text-[#0066FF]">{Math.round(pct)}%</span>
      </div>

      {/* 8 droplet indicators */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < glasses ? 'bg-[#0066FF]' : 'bg-[#1a1a1a]'
            }`}
          />
        ))}
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {[250, 500, 750].map(ml => (
          <button
            key={ml}
            onClick={() => addWater(ml)}
            className="flex-1 py-2 bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl text-xs font-semibold text-[#0066FF] hover:bg-[#0066FF]/20 transition-colors active:scale-95"
          >
            +{ml}ml
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

function getCurrentMealSection(): MealSection {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [showSearch, setShowSearch] = useState(false)
  const [searchMeal, setSearchMeal] = useState<MealSection>(getCurrentMealSection())
  const [showBarcode, setShowBarcode] = useState(false)
  const [showAiLog, setShowAiLog] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLogging, setAiLogging] = useState(false)

  // Fetch today's data
  const { data: todayData, mutate: mutateTodayData } = useSWR<TodayData>(
    `/api/nutrition/today?date=${selectedDate}`,
    fetcher,
    { revalidateOnFocus: true }
  )

  // Fetch targets
  const { data: targets } = useSWR<Targets>(
    '/api/nutrition/targets',
    fetcher
  )

  const foods = todayData?.foods || []
  const totals = todayData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const calorieTarget = targets?.calories || 2400
  const proteinTarget = targets?.protein || 190
  const carbsTarget = targets?.carbs || 250
  const fatTarget = targets?.fat || 70

  // Group foods by meal
  const groupedFoods: Record<MealSection, FoodItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  }
  for (const food of foods) {
    const section = (food.meal as MealSection) || 'snack'
    if (groupedFoods[section]) {
      groupedFoods[section].push(food)
    } else {
      groupedFoods.snack.push(food)
    }
  }

  // Date navigation
  function goToDate(offset: number) {
    haptics.selection()
    const d = offset > 0 ? addDays(new Date(selectedDate), 1) : subDays(new Date(selectedDate), 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const isToday = selectedDate === new Date().toISOString().slice(0, 10)

  // Delete food
  async function deleteFood(id: string) {
    haptics.medium()

    // Optimistic update
    if (todayData) {
      const updated = {
        ...todayData,
        foods: todayData.foods.filter(f => f.id !== id),
        totals: {
          calories: todayData.totals.calories - (todayData.foods.find(f => f.id === id)?.calories || 0),
          protein: todayData.totals.protein - (todayData.foods.find(f => f.id === id)?.protein || 0),
          carbs: todayData.totals.carbs - (todayData.foods.find(f => f.id === id)?.carbs || 0),
          fat: todayData.totals.fat - (todayData.foods.find(f => f.id === id)?.fat || 0),
        }
      }
      mutateTodayData(updated, false)
    }

    try {
      await fetch(`/api/nutrition/food/${id}`, { method: 'DELETE' })
      mutateTodayData()
    } catch {
      mutateTodayData() // Revert on error
    }
  }

  // Open search for a specific meal
  function openSearchForMeal(meal: MealSection) {
    setSearchMeal(meal)
    setShowSearch(true)
  }

  // Handle food added
  function handleFoodAdded() {
    mutateTodayData()
  }

  // Barcode lookup
  async function handleBarcode(barcode: string) {
    setShowBarcode(false)
    try {
      const res = await fetch(`/api/nutrition/barcode?barcode=${barcode}`)
      const data = await res.json()
      if (data.food) {
        // Log the barcode food directly
        await fetch('/api/nutrition/food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.food.name,
            calories: data.food.calories,
            protein: data.food.protein,
            carbs: data.food.carbs,
            fat: data.food.fat,
            servingUnit: 'serving',
            quantity: 1,
            meal: getCurrentMealSection(),
            date: selectedDate,
            source: 'barcode',
          }),
        })
        haptics.success()
        mutateTodayData()
      }
    } catch {
      haptics.error()
    }
  }

  // AI log
  async function handleAiLog() {
    if (!aiText.trim()) return
    setAiLogging(true)
    try {
      const res = await fetch('/api/nutrition/ai-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiText, meal: getCurrentMealSection(), date: selectedDate }),
      })
      if (res.ok) {
        haptics.success()
        setAiText('')
        setShowAiLog(false)
        mutateTodayData()
      }
    } catch {
      haptics.error()
    } finally {
      setAiLogging(false)
    }
  }

  return (
    <>
      <main className="min-h-screen bg-black text-white pb-28">
        {/* Header */}
        <header className="px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-3">
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#0066FF] uppercase">FORC3</div>
          <h1 className="text-2xl font-bold mt-0.5">Nutrition</h1>
        </header>

        {/* Date Picker */}
        <div className="flex items-center justify-between px-5 pb-4">
          <button onClick={() => goToDate(-1)} className="p-2 rounded-xl bg-[#141414] active:scale-95 transition-transform">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold text-white">
              {isToday ? 'Today' : format(new Date(selectedDate), 'EEEE')}
            </div>
            <div className="text-xs text-neutral-500">
              {format(new Date(selectedDate), 'MMM d, yyyy')}
            </div>
          </div>
          <button
            onClick={() => goToDate(1)}
            disabled={isToday}
            className="p-2 rounded-xl bg-[#141414] active:scale-95 transition-transform disabled:opacity-30"
          >
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="px-5 space-y-4">
          {/* Calorie Summary Card */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-center justify-center mb-4">
              <CalorieRing consumed={totals.calories} target={calorieTarget} />
            </div>

            {/* Macro bars */}
            <div className="space-y-3">
              <MacroBar label="Protein" value={totals.protein} target={proteinTarget} color="#3B82F6" />
              <MacroBar label="Carbs" value={totals.carbs} target={carbsTarget} color="#EAB308" />
              <MacroBar label="Fat" value={totals.fat} target={fatTarget} color="#F97316" />
            </div>

            {/* Macro Donut */}
            {totals.calories > 0 && (
              <MacroDonut protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
            )}

            {/* Protein tip */}
            {totals.protein < proteinTarget && totals.calories > 0 && (
              <div className="mt-4 p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl">
                <p className="text-xs text-[#3B82F6]">
                  {Math.round(proteinTarget - totals.protein)}g protein remaining -- aim for high-protein foods
                </p>
              </div>
            )}
          </div>

          {/* Water Tracker */}
          <WaterTracker selectedDate={selectedDate} />

          {/* Meal Sections */}
          <div className="space-y-3">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSection[]).map(section => (
              <MealSectionBlock
                key={section}
                section={section}
                foods={groupedFoods[section]}
                onDelete={deleteFood}
                onAdd={() => openSearchForMeal(section)}
              />
            ))}
          </div>

          {/* Empty state */}
          {foods.length === 0 && !todayData && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-[#141414] border border-[#262626] rounded-2xl">
              <svg className="w-12 h-12 text-neutral-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="font-semibold text-neutral-300">No meals logged yet</p>
              <p className="text-sm text-neutral-500 mt-1">Tap the buttons below to get started</p>
            </div>
          )}
        </div>

        {/* Sticky Bottom Quick Log Bar */}
        <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-5 pb-2">
          <div className="bg-[#141414]/95 backdrop-blur-md border border-[#262626] rounded-2xl p-2 flex gap-2">
            <button
              onClick={() => { haptics.light(); setShowBarcode(true) }}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl hover:bg-[#1a1a1a] transition-colors active:scale-95"
            >
              <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              </svg>
              <span className="text-[10px] font-semibold text-neutral-400">Scan</span>
            </button>

            <button
              onClick={() => { haptics.light(); setSearchMeal(getCurrentMealSection()); setShowSearch(true) }}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-[#0066FF] rounded-xl hover:bg-[#0052CC] transition-colors active:scale-95"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm font-bold text-white">Search Food</span>
            </button>

            <button
              onClick={() => { haptics.light(); setShowAiLog(true) }}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl hover:bg-[#1a1a1a] transition-colors active:scale-95"
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[10px] font-semibold text-neutral-400">AI Log</span>
            </button>
          </div>
        </div>

        <BottomNav active="discover" />
      </main>

      {/* Food Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <FoodSearchModal
            meal={searchMeal}
            date={selectedDate}
            onClose={() => setShowSearch(false)}
            onAdded={handleFoodAdded}
          />
        )}
      </AnimatePresence>

      {/* Barcode Scanner */}
      <AnimatePresence>
        {showBarcode && (
          <BarcodeScanner
            onDetect={handleBarcode}
            onClose={() => setShowBarcode(false)}
          />
        )}
      </AnimatePresence>

      {/* AI Log Bottom Sheet */}
      <BottomSheet
        isOpen={showAiLog}
        onClose={() => setShowAiLog(false)}
        title="AI Food Log"
      >
        <div className="px-5 pb-6 space-y-4">
          <p className="text-sm text-neutral-400">
            Describe what you ate and AI will estimate the nutrition.
          </p>
          <textarea
            value={aiText}
            onChange={e => setAiText(e.target.value)}
            placeholder="e.g. 2 scrambled eggs with 2 strips of bacon and a slice of toast with butter"
            rows={4}
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-3 text-sm text-white placeholder-neutral-600 focus:border-[#0066FF] focus:outline-none resize-none"
            autoFocus
          />
          <button
            onClick={handleAiLog}
            disabled={aiLogging || !aiText.trim()}
            className={`w-full py-3.5 font-bold rounded-xl transition-all ${
              aiLogging || !aiText.trim()
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-[0.98]'
            }`}
          >
            {aiLogging ? 'Estimating...' : 'Log with AI'}
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
