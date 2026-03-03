import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Clipboard, Copy, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'

type Mode = 'encode' | 'decode' | 'parse'

export default function UrlCodecPage() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useLocalStorage<Mode>('devutils-url-mode', 'parse')
  const [copied, setCopied] = useState<string | null>(null)

  const result = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) return { output: '', error: null, parsed: null }

    try {
      if (mode === 'encode') {
        return { output: encodeURIComponent(trimmed), error: null, parsed: null }
      } else if (mode === 'decode') {
        return { output: decodeURIComponent(trimmed), error: null, parsed: null }
      } else {
        const url = new URL(trimmed)
        const params: [string, string][] = []
        url.searchParams.forEach((v, k) => params.push([k, v]))
        return {
          output: '',
          error: null,
          parsed: {
            protocol: url.protocol,
            host: url.host,
            hostname: url.hostname,
            port: url.port || '(default)',
            pathname: url.pathname,
            search: url.search,
            hash: url.hash,
            origin: url.origin,
            params,
          },
        }
      }
    } catch {
      if (mode === 'parse') return { output: '', error: 'Invalid URL', parsed: null }
      return { output: '', error: 'Failed to process', parsed: null }
    }
  }, [input, mode])

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* */ }
  }, [])

  function handlePaste() {
    navigator.clipboard.readText().then(setInput).catch(() => {})
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copy(text, id)} className="rounded p-1 text-slate-500 hover:text-slate-300 cursor-pointer shrink-0" title="Copy">
      {copied === id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  )

  const hasInput = input.trim().length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b border-surface-700 bg-surface-950 px-6 pt-5 pb-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-100">URL Tools</h1>
          <div className="flex items-center rounded-lg border border-surface-600 bg-surface-800 p-0.5">
            {(['parse', 'encode', 'decode'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${mode === m ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {m === 'parse' ? 'Parse URL' : m === 'encode' ? 'Encode' : 'Decode'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Input</span>
              <div className="flex items-center gap-1">
                <button onClick={handlePaste} className="rounded-md p-1.5 text-slate-500 hover:bg-surface-700 hover:text-slate-300 cursor-pointer" title="Paste"><Clipboard className="h-3.5 w-3.5" /></button>
                <button onClick={() => setInput('')} disabled={!hasInput} className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 cursor-pointer disabled:opacity-30" title="Clear"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'parse' ? 'Paste a full URL to parse...' : mode === 'encode' ? 'Enter text to URL-encode...' : 'Enter URL-encoded string to decode...'}
              spellCheck={false}
              rows={3}
              className="w-full rounded-lg border border-surface-600 bg-surface-800 p-3 font-mono text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-amber-accent/50 resize-none leading-relaxed"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {hasInput && result.error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{result.error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Encode/Decode output */}
          {(mode === 'encode' || mode === 'decode') && result.output && (
            <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {mode === 'encode' ? 'Encoded' : 'Decoded'}
                </span>
                <CopyBtn text={result.output} id="output" />
              </div>
              <pre className="font-mono text-sm text-slate-200 whitespace-pre-wrap break-all">{result.output}</pre>
            </div>
          )}

          {/* Parsed URL */}
          {mode === 'parse' && result.parsed && (
            <div className="space-y-3">
              <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
                <h3 className="text-xs font-semibold text-slate-400 mb-3">URL Components</h3>
                <div className="space-y-1.5">
                  {[
                    { label: 'Origin', value: result.parsed.origin },
                    { label: 'Protocol', value: result.parsed.protocol },
                    { label: 'Host', value: result.parsed.host },
                    { label: 'Hostname', value: result.parsed.hostname },
                    { label: 'Port', value: result.parsed.port },
                    { label: 'Pathname', value: result.parsed.pathname },
                    { label: 'Search', value: result.parsed.search || '(none)' },
                    { label: 'Hash', value: result.parsed.hash || '(none)' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 rounded-lg bg-surface-900 px-3 py-2">
                      <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{row.label}</span>
                      <code className="flex-1 font-mono text-xs text-slate-200 break-all">{row.value}</code>
                      {row.value !== '(none)' && row.value !== '(default)' && <CopyBtn text={row.value} id={`p-${row.label}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {result.parsed.params.length > 0 && (
                <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
                  <h3 className="text-xs font-semibold text-slate-400 mb-3">
                    Query Parameters
                    <span className="ml-2 font-mono text-slate-500">{result.parsed.params.length}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {result.parsed.params.map(([key, val], idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg bg-surface-900 px-3 py-2">
                        <code className="font-mono text-xs text-amber-accent font-semibold shrink-0">{key}</code>
                        <span className="text-slate-600">=</span>
                        <code className="flex-1 font-mono text-xs text-slate-200 break-all">{val}</code>
                        <CopyBtn text={val} id={`q-${idx}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
