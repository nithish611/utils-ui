import { ArrowRight, Check, Clock, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

function formatDate(d: Date): string {
  return d.toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
}

function formatISO(d: Date): string {
  return d.toISOString()
}

function formatUTC(d: Date): string {
  return d.toUTCString()
}

function relativeTime(d: Date): string {
  const now = Date.now()
  const diff = now - d.getTime()
  const abs = Math.abs(diff)
  const future = diff < 0

  if (abs < 1000) return 'just now'
  if (abs < 60000) { const s = Math.floor(abs / 1000); return future ? `in ${s}s` : `${s}s ago` }
  if (abs < 3600000) { const m = Math.floor(abs / 60000); return future ? `in ${m}m` : `${m}m ago` }
  if (abs < 86400000) { const h = Math.floor(abs / 3600000); return future ? `in ${h}h` : `${h}h ago` }
  const days = Math.floor(abs / 86400000)
  return future ? `in ${days}d` : `${days}d ago`
}

export default function EpochPage() {
  const [now, setNow] = useState(Date.now())
  const [epochInput, setEpochInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const epochResult = (() => {
    if (!epochInput.trim()) return null
    const num = Number(epochInput.trim())
    if (isNaN(num)) return { error: 'Not a valid number' }
    const ms = epochInput.trim().length <= 10 ? num * 1000 : num
    const d = new Date(ms)
    if (isNaN(d.getTime())) return { error: 'Invalid timestamp' }
    return { date: d, ms, seconds: Math.floor(ms / 1000) }
  })()

  const dateResult = (() => {
    if (!dateInput.trim()) return null
    const d = new Date(dateInput.trim())
    if (isNaN(d.getTime())) return { error: 'Invalid date string' }
    return { date: d, epoch: Math.floor(d.getTime() / 1000), epochMs: d.getTime() }
  })()

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* */ }
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copy(text, id)} className="rounded p-1 text-slate-500 hover:text-slate-300 cursor-pointer" title="Copy">
      {copied === id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  )

  const nowDate = new Date(now)
  const inputClasses = 'w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-amber-accent/50 focus:ring-1 focus:ring-amber-accent/20'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b border-surface-700 bg-surface-950 px-6 pt-5 pb-4 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-100">Epoch Converter</h1>
          <div className="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-amber-accent" />
            <span className="font-mono text-sm text-slate-200">{Math.floor(now / 1000)}</span>
            <span className="text-xs text-slate-500">now</span>
            <CopyBtn text={String(Math.floor(now / 1000))} id="now" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
        <div className="max-w-3xl space-y-8">
          {/* Current time card */}
          <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Current Time</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Epoch (s)', value: String(Math.floor(now / 1000)), id: 'cur-s' },
                { label: 'Epoch (ms)', value: String(now), id: 'cur-ms' },
                { label: 'Local', value: formatDate(nowDate), id: 'cur-local' },
                { label: 'ISO 8601', value: formatISO(nowDate), id: 'cur-iso' },
                { label: 'UTC', value: formatUTC(nowDate), id: 'cur-utc' },
              ].map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-lg bg-surface-900 px-3 py-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{row.label}</span>
                    <p className="font-mono text-xs text-slate-200 mt-0.5">{row.value}</p>
                  </div>
                  <CopyBtn text={row.value} id={row.id} />
                </div>
              ))}
            </div>
          </div>

          {/* Epoch to Date */}
          <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              Epoch <ArrowRight className="h-3.5 w-3.5 text-slate-500" /> Date
            </h2>
            <input
              type="text"
              value={epochInput}
              onChange={(e) => setEpochInput(e.target.value)}
              placeholder="e.g. 1700000000 or 1700000000000"
              className={inputClasses}
            />
            {epochResult && !('error' in epochResult) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { label: 'Local', value: formatDate(epochResult.date), id: 'e-local' },
                  { label: 'ISO 8601', value: formatISO(epochResult.date), id: 'e-iso' },
                  { label: 'UTC', value: formatUTC(epochResult.date), id: 'e-utc' },
                  { label: 'Relative', value: relativeTime(epochResult.date), id: 'e-rel' },
                ].map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-lg bg-surface-900 px-3 py-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{row.label}</span>
                      <p className="font-mono text-xs text-slate-200 mt-0.5">{row.value}</p>
                    </div>
                    <CopyBtn text={row.value} id={row.id} />
                  </div>
                ))}
              </div>
            )}
            {epochResult && 'error' in epochResult && (
              <p className="mt-2 text-xs text-red-400">{epochResult.error}</p>
            )}
          </div>

          {/* Date to Epoch */}
          <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              Date <ArrowRight className="h-3.5 w-3.5 text-slate-500" /> Epoch
            </h2>
            <input
              type="text"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="e.g. 2024-01-15T10:30:00Z or Jan 15, 2024"
              className={inputClasses}
            />
            {dateResult && !('error' in dateResult) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { label: 'Epoch (seconds)', value: String(dateResult.epoch), id: 'd-s' },
                  { label: 'Epoch (milliseconds)', value: String(dateResult.epochMs), id: 'd-ms' },
                  { label: 'ISO 8601', value: formatISO(dateResult.date), id: 'd-iso' },
                  { label: 'Relative', value: relativeTime(dateResult.date), id: 'd-rel' },
                ].map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-lg bg-surface-900 px-3 py-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{row.label}</span>
                      <p className="font-mono text-xs text-slate-200 mt-0.5">{row.value}</p>
                    </div>
                    <CopyBtn text={row.value} id={row.id} />
                  </div>
                ))}
              </div>
            )}
            {dateResult && 'error' in dateResult && (
              <p className="mt-2 text-xs text-red-400">{dateResult.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
