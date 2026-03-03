import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { OAuthCallback } from './components/OAuthCallback'

const BACKEND_URL_KEY = 'mcp-backend-url'
const DEFAULT_BACKEND_URL = 'http://localhost:3000'

function getBackendUrl(): string {
  return localStorage.getItem(BACKEND_URL_KEY) || DEFAULT_BACKEND_URL
}

export default function MCPInspectorPage() {
  const [backendUrl, setBackendUrl] = useState(getBackendUrl)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [showSettings, setShowSettings] = useState(false)
  const [urlInput, setUrlInput] = useState(backendUrl)

  const isOAuthCallback = window.location.search.includes('oauth_success') || window.location.search.includes('oauth_error')

  useEffect(() => {
    let cancelled = false
    const checkBackend = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/health`, { signal: AbortSignal.timeout(3000) })
        if (!cancelled) setBackendStatus(res.ok ? 'online' : 'offline')
      } catch {
        if (!cancelled) setBackendStatus('offline')
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 10000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [backendUrl])

  const handleSaveUrl = () => {
    const trimmed = urlInput.trim().replace(/\/+$/, '')
    localStorage.setItem(BACKEND_URL_KEY, trimmed)
    localStorage.setItem('mcp-backend-url', trimmed)
    setBackendUrl(trimmed)
    setShowSettings(false)
    setBackendStatus('checking')
  }

  if (isOAuthCallback) {
    return (
      <div className="h-full">
        <OAuthCallback />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Backend status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-surface-700 bg-surface-900 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            backendStatus === 'online' ? 'bg-green-500' :
            backendStatus === 'offline' ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-slate-400">
            Backend: {backendUrl}
            {backendStatus === 'offline' && ' (unreachable)'}
          </span>
        </div>
        <button
          onClick={() => { setShowSettings(!showSettings); setUrlInput(backendUrl) }}
          className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {showSettings ? 'Cancel' : 'Settings'}
        </button>
      </div>

      {showSettings && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-700 bg-surface-950">
          <label className="text-xs text-slate-400 whitespace-nowrap">Backend URL:</label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
            className="flex-1 h-7 px-2 text-xs rounded border border-surface-600 bg-surface-800 text-slate-200"
            placeholder="http://localhost:3000"
          />
          <button
            onClick={handleSaveUrl}
            className="h-7 px-3 text-xs rounded bg-amber-accent text-surface-950 hover:bg-amber-accent/90 cursor-pointer font-medium"
          >
            Save
          </button>
        </div>
      )}

      {backendStatus === 'offline' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Backend Not Running</h3>
            <p className="text-sm text-slate-400 mb-4">
              The MCP Inspector backend server is not reachable at <code className="px-1 py-0.5 rounded bg-surface-800 text-xs text-amber-accent">{backendUrl}</code>
            </p>
            <div className="text-left bg-surface-800 rounded-lg p-4 text-xs">
              <p className="font-medium text-slate-200 mb-2">To start the backend:</p>
              <code className="block bg-surface-950 rounded p-2 font-mono text-amber-accent">
                cd server && npm install && npm run dev
              </code>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Layout />
        </div>
      )}
    </div>
  )
}
