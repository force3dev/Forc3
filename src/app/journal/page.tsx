'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface JournalEntry {
  id: string
  content: string
  date: string
  mood?: string
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('forc3_journal')
    if (stored) {
      try { setEntries(JSON.parse(stored)) } catch {}
    }
  }, [])

  function saveEntry() {
    if (!newEntry.trim()) return
    setSaving(true)

    const entry: JournalEntry = {
      id: Date.now().toString(),
      content: newEntry.trim(),
      date: new Date().toISOString(),
    }

    const updated = [entry, ...entries]
    setEntries(updated)
    localStorage.setItem('forc3_journal', JSON.stringify(updated))
    setNewEntry('')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function deleteEntry(id: string) {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem('forc3_journal', JSON.stringify(updated))
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-bold text-lg">Training Journal</h1>
          <p className="text-gray-500 text-xs">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* New Entry */}
        <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-5">
          <h2 className="font-semibold mb-1 text-sm text-gray-400 uppercase tracking-widest">
            How did today feel?
          </h2>
          <p className="text-gray-500 text-xs mb-4">
            Free write — session quality, how your body feels, what you learned
          </p>
          <textarea
            value={newEntry}
            onChange={e => setNewEntry(e.target.value)}
            placeholder="Today's session was..."
            rows={5}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF]/40 resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-600 text-xs">{newEntry.length} chars</span>
            <button
              onClick={saveEntry}
              disabled={!newEntry.trim() || saving}
              className="bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all"
            >
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>

        {/* Previous Entries */}
        {entries.length > 0 && (
          <div>
            <h2 className="text-sm text-gray-500 font-semibold uppercase tracking-widest mb-4">Previous Entries</h2>
            <div className="space-y-3">
              {entries.map(entry => (
                <div key={entry.id} className="bg-gray-900/30 border border-white/5 rounded-2xl p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs text-gray-500">{formatDate(entry.date)}</span>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-5xl mb-4">📓</div>
            <p className="font-semibold mb-1">No entries yet</p>
            <p className="text-sm">Write your first training note above</p>
          </div>
        )}
      </div>
    </div>
  )
}
