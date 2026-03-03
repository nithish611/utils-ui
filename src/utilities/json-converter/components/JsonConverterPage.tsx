import Editor, { type OnMount } from '@monaco-editor/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertCircle,
    ArrowRight,
    Check,
    Clipboard,
    Copy,
    Minimize2,
    Trash2,
    WrapText,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { convert, smartParseInput, type OutputFormat } from '../converter'

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'formatted', label: 'Pretty JSON' },
  { value: 'minified', label: 'Minified' },
  { value: 'js-object', label: 'JS Object' },
  { value: 'typescript', label: 'TypeScript' },
]


export default function JsonConverterPage() {
  const [input, setInput] = useState('')
  const [format, setFormat] = useLocalStorage<OutputFormat>('devutils-json-format', 'formatted')
  const [copiedSide, setCopiedSide] = useState<'left' | 'right' | null>(null)

  const result = useMemo(() => convert(input, format), [input, format])

  const copyToClipboard = useCallback(async (text: string, side: 'left' | 'right') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSide(side)
      setTimeout(() => setCopiedSide(null), 1500)
    } catch {
      // clipboard API may fail in some contexts
    }
  }, [])

  function handleFormat() {
    try {
      const parsed = smartParseInput(input.trim())
      setInput(JSON.stringify(parsed, null, 2))
    } catch {
      // ignore if invalid
    }
  }

  function handleMinify() {
    try {
      const parsed = smartParseInput(input.trim())
      setInput(JSON.stringify(parsed))
    } catch {
      // ignore if invalid
    }
  }

  function handlePaste() {
    navigator.clipboard.readText().then((text) => {
      setInput(text)
    }).catch(() => {
      // clipboard API may fail
    })
  }

  const inputEditorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const hasInput = input.trim().length > 0

  const outputLanguage = format === 'typescript' ? 'typescript' : format === 'js-object' ? 'javascript' : 'json'

  const handleInputMount: OnMount = (editor) => {
    inputEditorRef.current = editor
  }

  const handleInputChange = (value: string | undefined) => {
    if (value !== undefined) setInput(value)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-surface-700 bg-surface-950 px-6 pt-5 pb-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-100">JSON Converter</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-surface-600 bg-surface-800 p-0.5">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    format === opt.value
                      ? 'bg-surface-600 text-amber-accent'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Split pane editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: JSON input (Monaco) */}
        <div className="flex-1 flex flex-col border-r border-surface-700 min-w-0">
          <div className="shrink-0 flex items-center justify-between border-b border-surface-700 bg-surface-900 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Input (JSON / Stringified)
              </span>
              <AnimatePresence>
                {hasInput && result.error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Invalid JSON
                  </motion.div>
                )}
                {hasInput && !result.error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
                  >
                    <Check className="h-3 w-3" />
                    Valid
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePaste}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer"
                title="Paste from clipboard"
              >
                <Clipboard className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleFormat}
                disabled={!hasInput}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Format JSON"
              >
                <WrapText className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleMinify}
                disabled={!hasInput}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Minify JSON"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => copyToClipboard(input, 'left')}
                disabled={!hasInput}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Copy input"
              >
                {copiedSide === 'left' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => setInput('')}
                disabled={!hasInput}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Clear"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={input}
              onChange={handleInputChange}
              onMount={handleInputMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                folding: true,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                stickyScroll: { enabled: false },
                renderValidationDecorations: 'off',
                scrollbar: { vertical: 'auto', horizontal: 'auto' },
              }}
            />
          </div>
        </div>

        {/* Center divider with arrow */}
        <div className="shrink-0 flex flex-col items-center justify-center w-8 bg-surface-900 border-r border-surface-700">
          <ArrowRight className="h-4 w-4 text-slate-600" />
        </div>

        {/* Right pane: Output (Monaco, read-only) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="shrink-0 flex items-center justify-between border-b border-surface-700 bg-surface-900 px-4 py-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {FORMAT_OPTIONS.find((o) => o.value === format)?.label ?? 'Output'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => copyToClipboard(result.output, 'right')}
                disabled={!result.output}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Copy output"
              >
                {copiedSide === 'right' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            {hasInput && result.error ? (
              <div className="p-4">
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Parse Error</p>
                      <p className="mt-1 font-mono text-xs text-red-300/70">{result.error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Editor
                height="100%"
                language={outputLanguage}
                value={result.output || ''}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineNumbers: 'on',
                  folding: true,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  stickyScroll: { enabled: false },
                  scrollbar: { vertical: 'auto', horizontal: 'auto' },
                  domReadOnly: true,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
