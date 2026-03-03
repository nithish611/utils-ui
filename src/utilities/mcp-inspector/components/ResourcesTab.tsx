import {
    AlertCircle,
    Copy,
    Eye,
    FileText,
    FolderOpen,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useReadResource, useResources, type Resource } from '../hooks/useApi'
import { cn, copyToClipboard, parseMcpResult, type ParsedMcpResult } from '../lib/utils'
import { useConnectionStore } from '../stores/connectionStore'
import { useServersStore } from '../stores/serversStore'
import { JsonEditor } from './JsonEditor'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'

export function ResourcesTab() {
  const { getActiveServer, activeServerId } = useServersStore()
  const { status: legacyStatus } = useConnectionStore()
  const activeServer = getActiveServer()
  const status = activeServer?.status || legacyStatus
  const { data: resources, isLoading, refetch, error } = useResources(activeServerId || undefined)
  const readResourceMutation = useReadResource()

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [resourceContent, setResourceContent] = useState<ParsedMcpResult | null>(null)
  const [showRawContent, setShowRawContent] = useState(false)

  useEffect(() => {
    if (status.connected && status.capabilities?.resources) {
      refetch()
    }
  }, [status.connected, status.capabilities?.resources, refetch])

  const handleReadResource = async (resource: Resource) => {
    if (!activeServerId) return
    
    setSelectedResource(resource)
    setResourceContent(null)
    setShowRawContent(false)

    try {
      const result = await readResourceMutation.mutateAsync({ serverId: activeServerId, uri: resource.uri })
      const parsed = parseMcpResult(result)
      setResourceContent(parsed)
    } catch (error) {
      console.error('Failed to read resource:', error)
    }
  }

  const handleCopyContent = () => {
    if (resourceContent) {
      const textToCopy = resourceContent.isJson 
        ? JSON.stringify(resourceContent.data, null, 2)
        : resourceContent.rawText
      copyToClipboard(textToCopy)
    }
  }

  if (!status.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Not Connected</p>
        <p className="text-sm">Connect to an MCP server to view resources</p>
      </div>
    )
  }

  if (!status.capabilities?.resources) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Resources Not Supported</p>
        <p className="text-sm">This server does not expose any resources</p>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Resources List - fixed width sidebar */}
      <div className="w-72 shrink-0 border-r border-surface-700 flex flex-col h-full bg-surface-950">
        <div className="p-3 border-b border-surface-700 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <FolderOpen className="h-4 w-4" />
              Resources
              {resources && (
                <Badge variant="secondary" className="text-xs">
                  {resources.length}
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
                <p className="text-xs">Failed to load resources</p>
              </div>
            ) : resources?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-5 w-5 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No resources available</p>
              </div>
            ) : (
              resources?.map((resource) => (
                <div
                  key={resource.uri}
                  className={cn(
                    'px-2.5 py-2 rounded-md cursor-pointer transition-colors',
                    selectedResource?.uri === resource.uri
                      ? 'bg-amber-accent/10 text-amber-accent'
                      : 'text-slate-300 hover:bg-surface-800'
                  )}
                  onClick={() => handleReadResource(resource)}
                >
                  <p className="text-xs font-medium truncate">{resource.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{resource.uri}</p>
                  {resource.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{resource.description}</p>
                  )}
                  {resource.mimeType && (
                    <Badge variant="outline" className="text-[10px] mt-1">{resource.mimeType}</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Resource Content Preview */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-surface-700 bg-surface-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Eye className="h-4 w-4" />
            Content Preview
            {resourceContent && (
              <>
                {resourceContent.isError && (
                  <Badge variant="destructive" className="text-xs">Error</Badge>
                )}
                {resourceContent.isJson && !resourceContent.isError && (
                  <Badge variant="secondary" className="text-xs">JSON</Badge>
                )}
              </>
            )}
          </div>
          {resourceContent !== null && (
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-surface-600 rounded-md overflow-hidden">
                <Button
                  variant={!showRawContent ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowRawContent(false)}
                  className="rounded-none h-7 text-xs"
                >
                  Parsed
                </Button>
                <Button
                  variant={showRawContent ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowRawContent(true)}
                  className="rounded-none h-7 text-xs"
                >
                  Raw
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyContent} className="h-7 text-xs">
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            </div>
          )}
        </div>
        {selectedResource && (
          <div className="shrink-0 px-4 py-1.5 border-b border-surface-700 bg-surface-900/50">
            <p className="text-xs text-slate-400 truncate">{selectedResource.uri}</p>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto p-4">
          {readResourceMutation.isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : readResourceMutation.error ? (
            <div className="text-center py-8 text-red-400">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Failed to read resource</p>
              <p className="text-xs mt-1 opacity-75">
                {readResourceMutation.error instanceof Error
                  ? readResourceMutation.error.message
                  : 'Unknown error'}
              </p>
            </div>
          ) : resourceContent !== null ? (
            <div className="h-full">
              <JsonEditor
                value={showRawContent 
                  ? resourceContent.rawText
                  : (resourceContent.isJson 
                      ? JSON.stringify(resourceContent.data, null, 2)
                      : resourceContent.rawText
                    )
                }
                readOnly
                height="100%"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Eye className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Select a resource to preview its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
