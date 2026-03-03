import Editor, { DiffEditor } from '@monaco-editor/react'
import { ArrowLeftRight, Clipboard, Code, Columns2, Rows2, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

type ViewMode = 'input' | 'diff'
type DiffLayout = 'side' | 'inline'

const LANGUAGE_PATTERNS: Array<{ lang: string; patterns: RegExp[] }> = [
  { lang: 'typescript', patterns: [
    /\binterface\s+\w+/,  /\btype\s+\w+\s*=/, /:\s*(string|number|boolean|any)\b/,
    /\bas\s+(string|number|boolean|any)\b/, /<\w+(\s*,\s*\w+)*>/,
  ]},
  { lang: 'javascript', patterns: [
    /\b(const|let|var)\s+\w+\s*=/, /\bfunction\s+\w+/, /=>\s*[{(]/,
    /\brequire\s*\(/, /\bmodule\.exports\b/, /\bconsole\.\w+/,
  ]},
  { lang: 'python', patterns: [
    /\bdef\s+\w+\s*\(/, /\bclass\s+\w+.*:/, /\bimport\s+\w+/, /\bfrom\s+\w+\s+import/,
    /\bif\s+__name__\s*==/, /\bself\.\w+/,
  ]},
  { lang: 'java', patterns: [
    /\bpublic\s+(class|static|void)\b/, /\bprivate\s+(class|static|void)\b/,
    /\bSystem\.out\.print/, /\bpackage\s+[\w.]+;/, /\bimport\s+[\w.]+;/,
  ]},
  { lang: 'go', patterns: [
    /\bfunc\s+\w+/, /\bpackage\s+\w+/, /\bfmt\.Print/, /\b:=\s*/,
    /\btype\s+\w+\s+struct\b/,
  ]},
  { lang: 'rust', patterns: [
    /\bfn\s+\w+/, /\blet\s+mut\s+/, /\bimpl\s+\w+/, /\bpub\s+(fn|struct|enum)\b/,
    /\buse\s+\w+::/, /\bprintln!\(/,
  ]},
  { lang: 'html', patterns: [
    /<!DOCTYPE\s+html/i, /<html[\s>]/, /<\/?(div|span|p|a|img|head|body)\b/i,
  ]},
  { lang: 'css', patterns: [
    /\{[\s\S]*?[\w-]+\s*:\s*[\w#]/, /\.([\w-]+)\s*\{/, /#([\w-]+)\s*\{/,
    /@media\s/, /@import\s/,
  ]},
  { lang: 'sql', patterns: [
    /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i,
    /\bFROM\s+\w+/i, /\bWHERE\s+/i, /\bJOIN\s+/i,
  ]},
  { lang: 'json', patterns: [
    /^\s*[\[{]/, /"\w+"\s*:\s*/, /^\s*\{[\s\S]*\}\s*$/,
  ]},
  { lang: 'yaml', patterns: [
    /^\w[\w-]*:\s/, /^\s+-\s+\w/, /^---\s*$/m,
  ]},
  { lang: 'xml', patterns: [
    /<\?xml\s/, /<\/?\w+[\s>].*<\/\w+>/s, /<!\[CDATA\[/,
  ]},
  { lang: 'shell', patterns: [
    /^#!\/bin\/(bash|sh|zsh)/, /\b(echo|grep|awk|sed|curl|chmod)\b/,
    /\$\{?\w+\}?/, /\|\s*(grep|awk|sed)\b/,
  ]},
  { lang: 'dockerfile', patterns: [
    /^FROM\s+\w+/m, /^RUN\s+/m, /^COPY\s+/m, /^CMD\s+/m, /^EXPOSE\s+\d+/m,
  ]},
  { lang: 'markdown', patterns: [
    /^#{1,6}\s+\w/m, /^\*\*\w.*\*\*$/m, /^\s*[-*]\s+\w/m, /\[.*\]\(.*\)/,
  ]},
]

function detectLanguage(code: string): string {
  if (!code.trim()) return 'plaintext'

  const scores: Record<string, number> = {}
  for (const { lang, patterns } of LANGUAGE_PATTERNS) {
    let matches = 0
    for (const pattern of patterns) {
      if (pattern.test(code)) matches++
    }
    if (matches > 0) scores[lang] = matches
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best && best[1] >= 2 ? best[0] : 'plaintext'
}

export default function TextDiffPage() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('input')
  const [diffLayout, setDiffLayout] = useState<DiffLayout>('side')
  const [manualLang, setManualLang] = useState<string | null>(null)

  const detectedLang = useMemo(() => {
    const source = left || right
    return detectLanguage(source)
  }, [left, right])

  const language = manualLang ?? detectedLang

  const handleSwap = useCallback(() => {
    const tmp = left
    setLeft(right)
    setRight(tmp)
  }, [left, right])

  function handlePaste(side: 'left' | 'right') {
    navigator.clipboard.readText().then((text) => {
      if (side === 'left') setLeft(text)
      else setRight(text)
    }).catch(() => {})
  }

  const hasContent = left.length > 0 || right.length > 0
  const hasBoth = left.length > 0 && right.length > 0

  const LANG_OPTIONS = ['plaintext', 'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'html', 'css', 'json', 'yaml', 'xml', 'sql', 'shell', 'markdown', 'dockerfile']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-surface-700 bg-surface-950 px-6 pt-5 pb-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-100">Code Diff</h1>
            {/* Detected language badge */}
            <div className="flex items-center gap-1.5 rounded-md bg-surface-800 border border-surface-600 px-2 py-1">
              <Code className="h-3 w-3 text-slate-500" />
              <select
                value={language}
                onChange={(e) => setManualLang(e.target.value === detectedLang ? null : e.target.value)}
                className="bg-transparent text-xs font-mono text-amber-accent outline-none cursor-pointer"
              >
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l} className="bg-surface-900 text-slate-200">
                    {l}{l === detectedLang && !manualLang ? ' (auto)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-surface-600 bg-surface-800 p-0.5">
              <button
                onClick={() => setViewMode('input')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${viewMode === 'input' ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Edit
              </button>
              <button
                onClick={() => setViewMode('diff')}
                disabled={!hasBoth}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${viewMode === 'diff' ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Diff
              </button>
            </div>
            {/* Diff layout toggle (only in diff mode) */}
            {viewMode === 'diff' && (
              <div className="flex items-center rounded-lg border border-surface-600 bg-surface-800 p-0.5">
                <button
                  onClick={() => setDiffLayout('side')}
                  className={`rounded-md p-1.5 transition-colors cursor-pointer ${diffLayout === 'side' ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Side by side"
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDiffLayout('inline')}
                  className={`rounded-md p-1.5 transition-colors cursor-pointer ${diffLayout === 'inline' ? 'bg-surface-600 text-amber-accent' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Inline"
                >
                  <Rows2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button onClick={handleSwap} disabled={!hasContent} className="inline-flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-surface-700 cursor-pointer disabled:opacity-30">
              <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
            </button>
            <button onClick={() => { setLeft(''); setRight(''); setManualLang(null) }} disabled={!hasContent} className="inline-flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer disabled:opacity-30">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'input' ? (
          <div className="flex h-full">
            {/* Original editor */}
            <div className="flex-1 flex flex-col border-r border-surface-700 min-w-0">
              <div className="shrink-0 flex items-center justify-between border-b border-surface-700 bg-surface-900 px-4 py-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">Original</span>
                <button onClick={() => handlePaste('left')} className="rounded-md p-1.5 text-slate-500 hover:bg-surface-700 hover:text-slate-300 cursor-pointer" title="Paste"><Clipboard className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  value={left}
                  onChange={(v) => setLeft(v ?? '')}
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
                    stickyScroll: { enabled: false },
                    scrollbar: { vertical: 'auto', horizontal: 'auto' },
                  }}
                />
              </div>
            </div>
            {/* Modified editor */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="shrink-0 flex items-center justify-between border-b border-surface-700 bg-surface-900 px-4 py-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-500">Modified</span>
                <button onClick={() => handlePaste('right')} className="rounded-md p-1.5 text-slate-500 hover:bg-surface-700 hover:text-slate-300 cursor-pointer" title="Paste"><Clipboard className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  value={right}
                  onChange={(v) => setRight(v ?? '')}
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
                    stickyScroll: { enabled: false },
                    scrollbar: { vertical: 'auto', horizontal: 'auto' },
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <DiffEditor
            height="100%"
            language={language}
            original={left}
            modified={right}
            theme="vs-dark"
            options={{
              renderSideBySide: diffLayout === 'side',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              automaticLayout: true,
              wordWrap: 'on',
              stickyScroll: { enabled: false },
              readOnly: true,
              originalEditable: false,
              scrollbar: { vertical: 'auto', horizontal: 'auto' },
            }}
          />
        )}
      </div>
    </div>
  )
}
