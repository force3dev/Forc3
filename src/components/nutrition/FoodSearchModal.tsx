'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '@/lib/haptics'

interface FoodResult {
  id: string
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  servingSize: number
  servingUnit: string
  source: string
  barcode?: string
  imageUrl?: string
}

interface FoodSearchModalProps {
  meal: string
  date: string
  onClose: () => void
  onAdded: () => void
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; color: string }> = {
    usda: { label: 'USDA', color: 'text-green-400 bg-green-400/10' },
    openfoodfacts: { label: 'OFF', color: 'text-blue-400 bg-blue-400/10' },
    nutritionix: { label: 'NIX', color: 'text-purple-400 bg-purple-400/10' },
    calorieninjas: { label: 'CN', color: 'text-orange-400 bg-orange-400/10' },
  }
  const config = map[source] || { label: source.slice(0, 3).toUpperCase(), color: 'text-gray-400 bg-gray-400/10' }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.color}`}>{config.label}</span>
  )
}

const RECENT_FOODS_KEY = 'forc3_recent_foods'

function getRecentFoods(): FoodResult[] {
  try {
    const stored = localStorage.getItem(RECENT_FOODS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveRecentFood(food: FoodResult) {
  try {
    const existing = getRecentFoods()
    const filtered = existing.filter(f => f.name !== food.name)
    const updated = [food, ...filtered].slice(0, 10)
    localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

export function FoodSearchModal({ meal, date, onClose, onAdded }: FoodSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [logging, setLogging] = useState(false)
  const [recentFoods, setRecentFoods] = useState<FoodResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load recent foods on mount
  useEffect(() => {
    setRecentFoods(getRecentFoods())
  }, [])

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.foods || [])
      }
    } catch {
      // Search error
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  function selectFood(food: FoodResult) {
    haptics.selection()
    setSelectedFood(food)
    setQuantity(1)
  }

  function adjustQuantity(delta: number) {
    haptics.light()
    setQuantity(prev => Math.max(0.5, Math.round((prev + delta) * 10) / 10))
  }

  async function handleAdd() {
    if (!selectedFood) return
    setLogging(true)
    haptics.medium()

    try {
      const res = await fetch('/api/nutrition/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedFood.name,
          calories: selectedFood.calories,
          protein: selectedFood.protein,
          carbs: selectedFood.carbs,
          fat: selectedFood.fat,
          servingSize: selectedFood.servingSize,
          servingUnit: selectedFood.servingUnit,
          quantity,
          meal,
          date,
          source: selectedFood.source,
        }),
      })

      if (res.ok) {
        haptics.success()
        saveRecentFood(selectedFood)
        onAdded()
        onClose()
      }
    } catch {
      haptics.error()
    } finally {
      setLogging(false)
    }
  }

  const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1)

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-3">
        <h2 className="text-xl font-bold text-white">Add Food</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-5 pb-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search food database..."
            className="w-full py-3 pl-10 pr-10 bg-[#141414] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm text-white placeholder-neutral-500"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {query.length > 0 && (
          <p className="text-xs text-neutral-600 mt-2">
            {results.length > 0
              ? `${results.length} results from multiple sources`
              : searching
              ? 'Searching...'
              : query.length >= 2
              ? 'No results found'
              : 'Type at least 2 characters'}
          </p>
        )}
      </div>

      {/* Results / Quantity Panel */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedFood ? (
            <motion.div
              key="quantity"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="px-5 py-4 space-y-5"
            >
              {/* Back button */}
              <button
                onClick={() => setSelectedFood(null)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to results
              </button>

              {/* Selected food info */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{selectedFood.name}</h3>
                    {selectedFood.brand && (
                      <p className="text-xs text-neutral-500 mt-0.5">{selectedFood.brand}</p>
                    )}
                    <p className="text-xs text-neutral-600 mt-1">
                      Per {selectedFood.servingSize}{selectedFood.servingUnit}
                    </p>
                  </div>
                  <SourceBadge source={selectedFood.source} />
                </div>
              </div>

              {/* Quantity picker */}
              <div>
                <label className="text-xs text-neutral-400 mb-2 block">Servings</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustQuantity(-0.5)}
                    className="w-12 h-12 rounded-xl bg-[#1a1a1a] text-xl font-bold text-white hover:bg-[#262626] transition-colors flex items-center justify-center"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-white tabular-nums">{quantity}</div>
                    <div className="text-xs text-neutral-500">servings</div>
                  </div>
                  <button
                    onClick={() => adjustQuantity(0.5)}
                    className="w-12 h-12 rounded-xl bg-[#1a1a1a] text-xl font-bold text-white hover:bg-[#262626] transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Calculated macros */}
              <div className="bg-[#0a0a0a] rounded-2xl p-4">
                <div className="text-xs text-neutral-500 mb-3">Nutrition for {quantity} serving(s)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.round(selectedFood.calories * quantity)}</div>
                    <div className="text-xs text-neutral-500">calories</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#3B82F6]">{Math.round(selectedFood.protein * quantity * 10) / 10}g</div>
                    <div className="text-xs text-neutral-500">Protein</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#EAB308]">{Math.round(selectedFood.carbs * quantity * 10) / 10}g</div>
                    <div className="text-xs text-neutral-500">Carbs</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#F97316]">{Math.round(selectedFood.fat * quantity * 10) / 10}g</div>
                    <div className="text-xs text-neutral-500">Fat</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {results.length > 0 ? (
                <div className="bg-[#141414] border border-[#262626] mx-5 rounded-2xl overflow-hidden">
                  {results.map(food => (
                    <button
                      key={food.id}
                      onClick={() => selectFood(food)}
                      className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white truncate">{food.name}</span>
                            <SourceBadge source={food.source} />
                          </div>
                          {food.brand && (
                            <div className="text-xs text-neutral-500 truncate">{food.brand}</div>
                          )}
                          <div className="text-xs text-neutral-600 mt-0.5">
                            {food.servingSize}{food.servingUnit}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-sm text-white">{food.calories}</div>
                          <div className="text-[10px] text-neutral-500">kcal</div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-xs text-[#3B82F6]">{food.protein}g P</span>
                        <span className="text-xs text-[#EAB308]">{food.carbs}g C</span>
                        <span className="text-xs text-[#F97316]">{food.fat}g F</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.length < 2 ? (
                <div className="px-5 space-y-3">
                  {/* Recent Foods */}
                  {recentFoods.length > 0 && (
                    <>
                      <p className="text-sm text-neutral-500 mb-2">Recent</p>
                      <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden mb-4">
                        {recentFoods.map(food => (
                          <button
                            key={food.name}
                            onClick={() => selectFood(food)}
                            className="w-full flex items-center gap-3 px-5 py-4 border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a] transition-colors"
                          >
                            <span className="text-neutral-600 text-sm flex-shrink-0">{"\u{1F550}"}</span>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-white truncate">{food.name}</p>
                              <p className="text-xs text-neutral-500">{food.calories} cal {"\u00B7"} {food.servingSize}{food.servingUnit}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="text-sm text-neutral-500 mb-4">Popular searches</p>
                  {['Chicken breast', 'Oats', 'Eggs', 'Rice', 'Greek yogurt', 'Banana', 'Salmon'].map(s => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="w-full text-left px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-sm text-neutral-300 hover:border-[#0066FF] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      {selectedFood && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-5 py-4 border-t border-[#262626] pb-[max(env(safe-area-inset-bottom),1rem)]"
        >
          <button
            onClick={handleAdd}
            disabled={logging}
            className={`w-full py-3.5 font-bold rounded-xl transition-all text-base ${
              logging
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-[#0066FF] hover:bg-[#0052CC] text-white active:scale-[0.98]'
            }`}
          >
            {logging
              ? 'Adding...'
              : `Add to ${mealLabel} - ${Math.round(selectedFood.calories * quantity)} kcal`}
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
