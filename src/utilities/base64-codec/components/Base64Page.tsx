import Editor from '@monaco-editor/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertCircle,
    ArrowDownUp,
    Check,
    Clipboard,
    Copy,
    Trash2,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'

type Mode = 'encode' | 'decode'

export default function Base64Page() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useLocalStorage<Mode>('devutils-base64-mode', 'encode')
  const [copiedSide, setCopiedSide] = useState<'in' | 'out' | null>(null)

  const output = (() => {
    if (!input.trim()) return { text: '', error: null }
    try {
      if (mode === 'encode') {
        return { text: btoa(unescape(encodeURIComponent(input))), error: null }
      } else {
        return { text: decodeURIComponent(escape(atob(input.trim()))), error: null }
      }
    } catch {
      return {
        text: '',
        error: mode === 'decode' ? 'Invalid Base64 string' : 'Failed to encode',
      }
    }
  })()

  const copyToClipboard = useCallback(async (text: string, side: 'in' | 'out') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSide(side)
      setTimeout(() => setCopiedSide(null), 1500)
    } catch { /* */ }
  }, [])

  function handleSwap() {
    if (output.text) {
      setInput(output.text)
      setMode((m) => (m === 'encode' ? 'decode' : 'encode'))
    }
  }

  function handlePaste() {
    navigator.clipboard.readText().then(setInput).catch(() => {})
  }

  const hasInput = input.trim().length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b border-surface-700 bg-surface-950 px-6 pt-5 pb-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-100">Base64 Encode / Decode</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-surface-600 bg-surface-800 p-0.5">
              <button
                onClick={() => setMode('encode')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${mode === 'encode' ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Encode
              </button>
              <button
                onClick={() => setMode('decode')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${mode === 'decode' ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Decode
              </button>
            </div>
            <button
              onClick={handleSwap}
              disabled={!output.text}
              className="rounded-lg border border-surface-600 bg-surface-800 p-2 text-slate-400 transition-colors hover:text-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Swap input/output"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input */}
        <div className="flex-1 flex flex-col border-r border-surface-700 min-w-0">
          <div className="shrink-0 flex items-center justify-between border-b border-surface-700 bg-surface-900 px-4 py-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={handlePaste} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer" title="Paste">
                <Clipboard className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => copyToClipboard(input, 'in')} disabled={!hasInput} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Copy">
                {copiedSide === 'in' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setInput('')} disabled={!hasInput} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Clear">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="plaintext"
              value={input}
              onChange={(v) => setInput(v ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                folding: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                stickyScroll: { enabled: false },
                scrollbar: { vertical: 'auto', horizontal: 'auto' },
              }}
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="shrink-0 flex items-center justify-between border-b border-surface-700 bg-surface-900 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
              </span>
              <AnimatePresence>
                {hasInput && output.error && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => copyToClipboard(output.text, 'out')} disabled={!output.text} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Copy output">
              {copiedSide === 'out' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="flex-1">
            {output.error ? (
              <div className="p-4">
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <p className="font-mono text-xs text-red-300/70">{output.error}</p>
                </div>
              </div>
            ) : (
              <Editor
                height="100%"
                defaultLanguage="plaintext"
                value={output.text}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineNumbers: 'on',
                  folding: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  stickyScroll: { enabled: false },
                  scrollbar: { vertical: 'auto', horizontal: 'auto' },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
