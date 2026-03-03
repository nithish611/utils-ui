import {
    AlertCircle,
    Code,
    Copy,
    FormInput,
    Loader2,
    Play,
    RefreshCw,
    Search,
    Wrench,
    X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useCallTool, useTools, type Tool } from '../hooks/useApi'
import { cn, copyToClipboard, parseMcpResult, type ParsedMcpResult } from '../lib/utils'
import { useServersStore } from '../stores/serversStore'
import { JsonEditor } from './JsonEditor'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'

// Local storage key for tool arguments
const TOOL_ARGS_STORAGE_KEY = 'mcp-tool-args'

// Get stored tool arguments
function getStoredToolArgs(serverId: string, toolName: string): string | null {
  try {
    const stored = localStorage.getItem(TOOL_ARGS_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return data[serverId]?.[toolName] || null
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Store tool arguments
function storeToolArgs(serverId: string, toolName: string, args: string): void {
  try {
    const stored = localStorage.getItem(TOOL_ARGS_STORAGE_KEY)
    const data = stored ? JSON.parse(stored) : {}
    if (!data[serverId]) {
      data[serverId] = {}
    }
    data[serverId][toolName] = args
    localStorage.setItem(TOOL_ARGS_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore errors
  }
}

// Local storage key for tool results cache
const TOOL_RESULTS_CACHE_KEY = 'mcp-tool-results-cache'

// Get cached tool result
function getCachedToolResult(serverId: string, toolName: string): ParsedMcpResult | null {
  try {
    const stored = localStorage.getItem(TOOL_RESULTS_CACHE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return data[serverId]?.[toolName] || null
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Store tool result in cache
function storeCachedToolResult(serverId: string, toolName: string, result: ParsedMcpResult): void {
  try {
    const stored = localStorage.getItem(TOOL_RESULTS_CACHE_KEY)
    const data = stored ? JSON.parse(stored) : {}
    if (!data[serverId]) {
      data[serverId] = {}
    }
    data[serverId][toolName] = result
    localStorage.setItem(TOOL_RESULTS_CACHE_KEY, JSON.stringify(data))
  } catch {
    // Ignore errors
  }
}

export function ToolsTab() {
  const { activeServerId, servers } = useServersStore()
  const activeServer = servers.find((s) => s.id === activeServerId)
  const isConnected = activeServer?.status?.connected === true
  
  const { data: tools, isLoading, refetch, error } = useTools(activeServerId || '')
  const callToolMutation = useCallTool()

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [toolArgs, setToolArgs] = useState<string>('{}')
  const [toolResult, setToolResult] = useState<unknown>(null)
  const [parsedResult, setParsedResult] = useState<ParsedMcpResult | null>(null)
  const [inputMode, setInputMode] = useState<'json' | 'form'>('form')
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [toolSearchQuery, setToolSearchQuery] = useState('')

  // Filter tools based on search query
  const filteredTools = useMemo(() => {
    if (!tools || !toolSearchQuery.trim()) return tools
    const query = toolSearchQuery.toLowerCase()
    return tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description?.toLowerCase().includes(query)
    )
  }, [tools, toolSearchQuery])

  // Reset selected tool when server changes
  useEffect(() => {
    setSelectedTool(null)
    setToolResult(null)
    setParsedResult(null)
    setToolSearchQuery('')
  }, [activeServerId])

  // Refetch tools when connected
  useEffect(() => {
    if (isConnected && activeServerId) {
      refetch()
    }
  }, [isConnected, activeServerId, refetch])

  // Initialize tool arguments when tool is selected
  useEffect(() => {
    if (selectedTool && activeServerId) {
      // Try to get stored arguments first
      const storedArgs = getStoredToolArgs(activeServerId, selectedTool.name)
      if (storedArgs) {
        setToolArgs(storedArgs)
        try {
          const parsed = JSON.parse(storedArgs)
          setFormValues(
            Object.fromEntries(
              Object.entries(parsed).map(([k, v]) => [k, String(v)])
            )
          )
        } catch {
          setFormValues({})
        }
      } else {
        // Generate default arguments from schema
        const defaultArgs: Record<string, unknown> = {}
        const props = selectedTool.inputSchema.properties || {}
        
        Object.entries(props).forEach(([key, value]) => {
          const prop = value as { type?: string; default?: unknown }
          if (prop.default !== undefined) {
            defaultArgs[key] = prop.default
          } else if (prop.type === 'string') {
            defaultArgs[key] = ''
          } else if (prop.type === 'number' || prop.type === 'integer') {
            defaultArgs[key] = 0
          } else if (prop.type === 'boolean') {
            defaultArgs[key] = false
          } else if (prop.type === 'array') {
            defaultArgs[key] = []
          } else if (prop.type === 'object') {
            defaultArgs[key] = {}
          }
        })

        const argsStr = JSON.stringify(defaultArgs, null, 2)
        setToolArgs(argsStr)
        setFormValues(
          Object.fromEntries(
            Object.entries(defaultArgs).map(([k, v]) => [k, String(v)])
          )
        )
      }

      // Try to get cached result
      const cachedResult = getCachedToolResult(activeServerId, selectedTool.name)
      if (cachedResult) {
        setParsedResult(cachedResult)
        setToolResult(cachedResult.data)
      } else {
        setToolResult(null)
        setParsedResult(null)
      }
    }
  }, [selectedTool, activeServerId])

  // Store tool arguments when they change
  useEffect(() => {
    if (selectedTool && activeServerId && toolArgs) {
      storeToolArgs(activeServerId, selectedTool.name, toolArgs)
    }
  }, [toolArgs, selectedTool, activeServerId])

  const handleExecuteTool = useCallback(async () => {
    if (!selectedTool || !activeServerId) return

    try {
      const args = inputMode === 'json' ? JSON.parse(toolArgs) : formValues
      const result = await callToolMutation.mutateAsync({
        serverId: activeServerId,
        name: selectedTool.name,
        arguments: Object.keys(args).length > 0 ? args : undefined,
      })
      setToolResult(result)
      const parsed = parseMcpResult(result)
      setParsedResult(parsed)
      // Cache the result
      storeCachedToolResult(activeServerId, selectedTool.name, parsed)
    } catch (error) {
      if (error instanceof SyntaxError) {
        const errorResult = { error: 'Invalid JSON in arguments' }
        setToolResult(errorResult)
        setParsedResult({ 
          data: errorResult, 
          rawText: JSON.stringify(errorResult, null, 2), 
          isJson: true, 
          isError: true, 
          contentType: 'text' 
        })
      } else {
        const errorResult = {
          error: error instanceof Error ? error.message : 'Tool execution failed',
        }
        setToolResult(errorResult)
        setParsedResult({ 
          data: errorResult, 
          rawText: JSON.stringify(errorResult, null, 2), 
          isJson: true, 
          isError: true, 
          contentType: 'text' 
        })
      }
    }
  }, [selectedTool, activeServerId, inputMode, toolArgs, formValues, callToolMutation])

  // Keyboard shortcut: Cmd/Ctrl + Enter to execute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (selectedTool && !callToolMutation.isPending) {
          e.preventDefault()
          handleExecuteTool()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTool, callToolMutation.isPending, handleExecuteTool])

  const handleCopyResult = () => {
    if (parsedResult) {
      copyToClipboard(parsedResult.isJson ? JSON.stringify(parsedResult.data, null, 2) : parsedResult.rawText)
    } else if (toolResult) {
      copyToClipboard(JSON.stringify(toolResult, null, 2))
    }
  }

  const updateFormValue = (key: string, value: string) => {
    const newValues = { ...formValues, [key]: value }
    setFormValues(newValues)
    // Sync to JSON
    try {
      const jsonObj: Record<string, unknown> = {}
      const props = selectedTool?.inputSchema.properties || {}
      Object.entries(newValues).forEach(([k, v]) => {
        const prop = props[k] as { type?: string } | undefined
        if (prop?.type === 'number' || prop?.type === 'integer') {
          jsonObj[k] = Number(v) || 0
        } else if (prop?.type === 'boolean') {
          jsonObj[k] = v === 'true'
        } else {
          jsonObj[k] = v
        }
      })
      setToolArgs(JSON.stringify(jsonObj, null, 2))
    } catch {
      // Ignore sync errors
    }
  }

  if (!activeServerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <Wrench className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Server Selected</p>
        <p className="text-sm">Select a server from the sidebar to view tools</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <Wrench className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Not Connected</p>
        <p className="text-sm">Connect to the server to view tools</p>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Tools List - fixed width sidebar */}
      <div className="w-64 shrink-0 border-r border-surface-700 flex flex-col h-full bg-surface-950">
        <div className="p-3 border-b border-surface-700 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Wrench className="h-4 w-4" />
              Tools
              {tools && (
                <Badge variant="secondary" className="text-xs">
                  {filteredTools?.length}{toolSearchQuery && `/${tools.length}`}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-7 w-7 p-0">
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </Button>
          </div>
          {tools && tools.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Search tools..."
                value={toolSearchQuery}
                onChange={(e) => setToolSearchQuery(e.target.value)}
                className="h-7 pl-8 pr-8 text-xs"
              />
              {toolSearchQuery && (
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setToolSearchQuery('')}>
                  <X className="h-3.5 w-3.5 text-slate-500 hover:text-slate-200" />
                </button>
              )}
            </div>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                <p className="text-xs">Failed to load tools</p>
              </div>
            ) : tools?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wrench className="h-5 w-5 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No tools available</p>
              </div>
            ) : filteredTools?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Search className="h-5 w-5 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No match for "{toolSearchQuery}"</p>
              </div>
            ) : (
              filteredTools?.map((tool) => (
                <div
                  key={tool.name}
                  className={cn(
                    'px-2.5 py-2 rounded-md cursor-pointer transition-colors',
                    selectedTool?.name === tool.name
                      ? 'bg-amber-accent/10 text-amber-accent'
                      : 'text-slate-300 hover:bg-surface-800'
                  )}
                  onClick={() => setSelectedTool(tool)}
                >
                  <p className="font-mono text-xs font-medium truncate">{tool.name}</p>
                  {tool.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tool.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Tool Execution Area - resizable vertical split */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        <Group orientation="vertical" className="h-full">
          {/* Arguments Panel */}
          <Panel defaultSize={40} minSize={15}>
            <div className="h-full flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-surface-700 bg-surface-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  {selectedTool ? (
                    <>
                      <span className="font-mono">{selectedTool.name}</span>
                      <Badge variant="outline" className="text-xs">Arguments</Badge>
                    </>
                  ) : (
                    'Tool Arguments'
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedTool && (
                    <div className="flex items-center border border-surface-600 rounded-md p-0.5">
                      <button
                        className={cn(
                          'px-2 py-0.5 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer',
                          inputMode === 'json' ? 'bg-amber-accent text-surface-950' : 'text-slate-400 hover:bg-surface-700'
                        )}
                        onClick={() => setInputMode('json')}
                      >
                        <Code className="h-3 w-3" />
                        JSON
                      </button>
                      <button
                        className={cn(
                          'px-2 py-0.5 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer',
                          inputMode === 'form' ? 'bg-amber-accent text-surface-950' : 'text-slate-400 hover:bg-surface-700'
                        )}
                        onClick={() => setInputMode('form')}
                      >
                        <FormInput className="h-3 w-3" />
                        Form
                      </button>
                    </div>
                  )}
                  <Button size="sm" onClick={handleExecuteTool} disabled={!selectedTool || callToolMutation.isPending} title="Execute (⌘+Enter)">
                    {callToolMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}
                    Execute
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4">
                {selectedTool ? (
                  inputMode === 'json' ? (
                    <div className="h-full">
                      <JsonEditor value={toolArgs} onChange={setToolArgs} height="100%" schema={selectedTool.inputSchema} />
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-xl">
                      {Object.entries(selectedTool.inputSchema.properties || {}).map(([key, value]) => {
                        const prop = value as { type?: string; description?: string }
                        const isRequired = (selectedTool.inputSchema.required || []).includes(key)
                        return (
                          <div key={key} className="space-y-1.5">
                            <Label className="flex items-center gap-2">
                              {key}
                              {isRequired && <span className="text-red-400">*</span>}
                              <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                            </Label>
                            {prop.description && <p className="text-xs text-slate-500">{prop.description}</p>}
                            <Input value={formValues[key] || ''} onChange={(e) => updateFormValue(key, e.target.value)} placeholder={`Enter ${key}`} />
                          </div>
                        )
                      })}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Wrench className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Select a tool to configure arguments</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Draggable resize handle */}
          <Separator className="h-1.5 bg-surface-800 hover:bg-amber-accent/30 active:bg-amber-accent/50 transition-colors cursor-row-resize data-resize-handle-active:bg-amber-accent/50" />

          {/* Results Panel */}
          <Panel defaultSize={60} minSize={15}>
            <div className="h-full flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-surface-700 bg-surface-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  Result
                  {callToolMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {parsedResult && (
                  <Button variant="ghost" size="sm" onClick={handleCopyResult} className="h-7 text-xs">
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4">
                {parsedResult ? (
                  <div className="h-full">
                    <JsonEditor
                      value={parsedResult.isJson ? JSON.stringify(parsedResult.data, null, 2) : parsedResult.rawText}
                      onChange={() => {}}
                      height="100%"
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Play className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Execute a tool to see results</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  )
}
