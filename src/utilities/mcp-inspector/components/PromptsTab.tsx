import {
    AlertCircle,
    Copy,
    Loader2,
    MessageSquare,
    RefreshCw,
    Send,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useGetPrompt, usePrompts, type Prompt } from '../hooks/useApi'
import { cn, copyToClipboard, parseMcpResult, type ParsedMcpResult } from '../lib/utils'
import { useConnectionStore } from '../stores/connectionStore'
import { useServersStore } from '../stores/serversStore'
import { JsonEditor } from './JsonEditor'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'

export function PromptsTab() {
  const { getActiveServer, activeServerId } = useServersStore()
  const { status: legacyStatus } = useConnectionStore()
  const activeServer = getActiveServer()
  const status = activeServer?.status || legacyStatus
  const { data: prompts, isLoading, refetch, error } = usePrompts(activeServerId || undefined)
  const getPromptMutation = useGetPrompt()

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [promptArgs, setPromptArgs] = useState<Record<string, string>>({})
  const [promptResult, setPromptResult] = useState<ParsedMcpResult | null>(null)
  const [showRawResult, setShowRawResult] = useState(false)

  useEffect(() => {
    if (status.connected && status.capabilities?.prompts) {
      refetch()
    }
  }, [status.connected, status.capabilities?.prompts, refetch])

  useEffect(() => {
    if (selectedPrompt) {
      const initialArgs: Record<string, string> = {}
      selectedPrompt.arguments?.forEach((arg) => {
        initialArgs[arg.name] = ''
      })
      setPromptArgs(initialArgs)
      setPromptResult(null)
    }
  }, [selectedPrompt])

  const handleGetPrompt = async () => {
    if (!selectedPrompt || !activeServerId) return

    try {
      const filteredArgs: Record<string, string> = {}
      Object.entries(promptArgs).forEach(([key, value]) => {
        if (value.trim()) {
          filteredArgs[key] = value
        }
      })

      const result = await getPromptMutation.mutateAsync({
        serverId: activeServerId,
        name: selectedPrompt.name,
        arguments: Object.keys(filteredArgs).length > 0 ? filteredArgs : undefined,
      })
      const parsed = parseMcpResult(result)
      setPromptResult(parsed)
      setShowRawResult(false)
    } catch (error) {
      setPromptResult({
        data: { error: error instanceof Error ? error.message : 'Failed to get prompt' },
        rawText: error instanceof Error ? error.message : 'Failed to get prompt',
        isJson: false,
        isError: true,
        contentType: 'error',
      })
    }
  }

  const handleCopyResult = () => {
    if (promptResult) {
      const textToCopy = promptResult.isJson 
        ? JSON.stringify(promptResult.data, null, 2)
        : promptResult.rawText
      copyToClipboard(textToCopy)
    }
  }

  const updateArg = (name: string, value: string) => {
    setPromptArgs((prev) => ({ ...prev, [name]: value }))
  }

  if (!status.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Not Connected</p>
        <p className="text-sm">Connect to an MCP server to view prompts</p>
      </div>
    )
  }

  if (!status.capabilities?.prompts) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Prompts Not Supported</p>
        <p className="text-sm">This server does not expose any prompts</p>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Prompts List - fixed width sidebar */}
      <div className="w-72 shrink-0 border-r border-surface-700 flex flex-col h-full bg-surface-950">
        <div className="p-3 border-b border-surface-700 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <MessageSquare className="h-4 w-4" />
              Prompts
              {prompts && (
                <Badge variant="secondary" className="text-xs">
                  {prompts.length}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-7 w-7 p-0">
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </Button>
          </div>
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
                <p className="text-xs">Failed to load prompts</p>
              </div>
            ) : prompts?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-5 w-5 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No prompts available</p>
              </div>
            ) : (
              prompts?.map((prompt) => (
                <div
                  key={prompt.name}
                  className={cn(
                    'px-2.5 py-2 rounded-md cursor-pointer transition-colors',
                    selectedPrompt?.name === prompt.name
                      ? 'bg-amber-accent/10 text-amber-accent'
                      : 'text-slate-300 hover:bg-surface-800'
                  )}
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <p className="text-xs font-medium truncate">{prompt.name}</p>
                  {prompt.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{prompt.description}</p>
                  )}
                  {prompt.arguments && prompt.arguments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prompt.arguments.map((arg) => (
                        <Badge
                          key={arg.name}
                          variant={arg.required ? 'default' : 'outline'}
                          className="text-[10px]"
                        >
                          {arg.name}{arg.required && '*'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Prompt Execution Area - resizable vertical split */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        <Group orientation="vertical" className="h-full">
          {/* Arguments Panel */}
          <Panel defaultSize={35} minSize={15}>
            <div className="h-full flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-surface-700 bg-surface-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  {selectedPrompt ? (
                    <>
                      <span>{selectedPrompt.name}</span>
                      <Badge variant="outline" className="text-xs">Arguments</Badge>
                    </>
                  ) : (
                    'Prompt Arguments'
                  )}
                </div>
                <Button size="sm" onClick={handleGetPrompt} disabled={!selectedPrompt || getPromptMutation.isPending}>
                  {getPromptMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                  Get Prompt
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4">
                {selectedPrompt ? (
                  selectedPrompt.arguments && selectedPrompt.arguments.length > 0 ? (
                    <div className="space-y-3 max-w-xl">
                      {selectedPrompt.arguments.map((arg) => (
                        <div key={arg.name} className="space-y-1.5">
                          <Label className="flex items-center gap-2">
                            {arg.name}
                            {arg.required && <span className="text-red-400">*</span>}
                          </Label>
                          {arg.description && <p className="text-xs text-slate-500">{arg.description}</p>}
                          <Input
                            value={promptArgs[arg.name] || ''}
                            onChange={(e) => updateArg(arg.name, e.target.value)}
                            placeholder={`Enter ${arg.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">This prompt has no arguments</p>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                    <MessageSquare className="h-6 w-6 mb-2 opacity-50" />
                    <p className="text-sm">Select a prompt to configure arguments</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Draggable resize handle */}
          <Separator className="h-1.5 bg-surface-800 hover:bg-amber-accent/30 active:bg-amber-accent/50 transition-colors cursor-row-resize data-resize-handle-active:bg-amber-accent/50" />

          {/* Results Panel */}
          <Panel defaultSize={65} minSize={15}>
            <div className="h-full flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-surface-700 bg-surface-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  Generated Messages
                  {getPromptMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {promptResult && (
                    <>
                      {promptResult.isError && <Badge variant="destructive" className="text-xs">Error</Badge>}
                      {promptResult.isJson && !promptResult.isError && <Badge variant="secondary" className="text-xs">JSON</Badge>}
                    </>
                  )}
                </div>
                {promptResult !== null && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-surface-600 rounded-md overflow-hidden">
                      <Button
                        variant={!showRawResult ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setShowRawResult(false)}
                        className="rounded-none h-7 text-xs"
                      >
                        Parsed
                      </Button>
                      <Button
                        variant={showRawResult ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setShowRawResult(true)}
                        className="rounded-none h-7 text-xs"
                      >
                        Raw
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyResult} className="h-7 text-xs">
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4">
                {promptResult !== null ? (
                  <div className="h-full">
                    <JsonEditor
                      value={showRawResult 
                        ? promptResult.rawText
                        : (promptResult.isJson 
                            ? JSON.stringify(promptResult.data, null, 2)
                            : promptResult.rawText
                          )
                      }
                      readOnly
                      height="100%"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Send className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Get a prompt to see generated messages</p>
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
