import { motion } from 'framer-motion'
import { Check, Copy, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'

type UuidFormat = 'v4' | 'v4-upper' | 'v4-no-dash' | 'short'

const FORMAT_OPTIONS: { value: UuidFormat; label: string }[] = [
  { value: 'v4', label: 'UUID v4' },
  { value: 'v4-upper', label: 'Uppercase' },
  { value: 'v4-no-dash', label: 'No Dashes' },
  { value: 'short', label: 'Short ID (8)' },
]

function generateUuid(format: UuidFormat): string {
  const uuid = crypto.randomUUID()
  switch (format) {
    case 'v4': return uuid
    case 'v4-upper': return uuid.toUpperCase()
    case 'v4-no-dash': return uuid.replace(/-/g, '')
    case 'short': return uuid.replace(/-/g, '').slice(0, 8)
  }
}

export default function UuidPage() {
  const [format, setFormat] = useLocalStorage<UuidFormat>('devutils-uuid-format', 'v4')
  const [ids, setIds] = useState<string[]>(() => [generateUuid('v4')])
  const [copied, setCopied] = useState<number | 'all' | null>(null)

  function generate(count: number = 1) {
    const newIds = Array.from({ length: count }, () => generateUuid(format))
    setIds((prev) => [...newIds, ...prev])
  }

  function regenerateAll() {
    setIds((prev) => prev.map(() => generateUuid(format)))
  }

  const copyToClipboard = useCallback(async (text: string, idx: number | 'all') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(idx)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* */ }
  }, [])

  function handleFormatChange(f: UuidFormat) {
    setFormat(f)
    setIds((prev) => prev.length > 0 ? Array.from({ length: prev.length }, () => generateUuid(f)) : [generateUuid(f)])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b border-surface-700 bg-surface-950 px-6 pt-5 pb-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-100">UUID Generator</h1>
            <span className="font-mono text-xs text-slate-500">{ids.length} generated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-surface-600 bg-surface-800 p-0.5">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFormatChange(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${format === opt.value ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => generate(1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-accent text-surface-950 px-3 py-2 text-xs font-semibold transition-colors hover:bg-amber-400 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate
          </button>
          <button
            onClick={() => generate(5)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-surface-700 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Bulk (5)
          </button>
          <button
            onClick={regenerateAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-surface-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate All
          </button>
          <button
            onClick={() => copyToClipboard(ids.join('\n'), 'all')}
            disabled={ids.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-surface-700 cursor-pointer disabled:opacity-30"
          >
            {copied === 'all' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            Copy All
          </button>
          <button
            onClick={() => setIds([])}
            disabled={ids.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8">
        <div className="flex flex-col gap-1.5">
          {ids.map((id, idx) => (
            <motion.div
              key={`${id}-${idx}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: idx < 5 ? idx * 0.03 : 0 }}
              className="group flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 transition-colors hover:border-surface-600"
            >
              <span className="font-mono text-xs text-slate-500 w-6 text-right shrink-0">{idx + 1}</span>
              <code className="flex-1 font-mono text-sm text-slate-200 select-all">{id}</code>
              <button
                onClick={() => copyToClipboard(id, idx)}
                className="rounded-md p-1.5 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-700 hover:text-slate-300 cursor-pointer"
                title="Copy"
              >
                {copied === idx ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
