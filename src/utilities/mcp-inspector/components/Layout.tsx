import {
    Activity,
    ChevronDown,
    FolderOpen,
    Keyboard,
    Loader2,
    MessageSquare,
    Plug,
    Plus,
    Server as ServerIcon,
    Settings,
    Unplug,
    Wrench,
    X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useConnect, useConnectedServers, useDisconnect } from '../hooks/useApi'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useWebSocket } from '../hooks/useWebSocket'
import { useConnectionStore } from '../stores/connectionStore'
import { useLogsStore } from '../stores/logsStore'
import type { Server, ServerConfig } from '../stores/serversStore'
import { useServersStore } from '../stores/serversStore'
import { LogsTab } from './LogsTab'
import { PromptsTab } from './PromptsTab'
import { ResourcesTab } from './ResourcesTab'
import { ServerConfigModal } from './ServerConfigModal'
import { ToolsTab } from './ToolsTab'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export function Layout() {
  const [activeTab, setActiveTab] = useState('tools')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showServerDropdown, setShowServerDropdown] = useState(false)
  const [showServerModal, setShowServerModal] = useState(false)
  const [editingServer, setEditingServer] = useState<Server | null>(null)
  const autoReconnectAttempted = useRef(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { clearServerLogs } = useWebSocket()
  const {
    servers,
    getActiveServer,
    getConnectedServers,
    setServerConnecting,
    setServerStatus,
    setActiveServer,
    addServer,
    removeServer,
    updateServer,
    updateServerConfig,
  } = useServersStore()
  const { logs, toggleExpanded, clearLogs } = useLogsStore()
  const { setStatus: setLegacyStatus } = useConnectionStore()

  const connectMutation = useConnect()
  const disconnectMutation = useDisconnect()
  const { data: backendConnectedServers } = useConnectedServers()

  const activeServer = getActiveServer()
  const connectedServers = getConnectedServers()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowServerDropdown(false)
      }
    }
    if (showServerDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showServerDropdown])

  const handleOAuthSuccess = useCallback(async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId)
    if (!server) return
    setActiveServer(serverId)
    setServerConnecting(serverId, true)
    try {
      const configWithCorrectRedirect = {
        ...server.config,
        oauth: server.config.oauth ? { ...server.config.oauth, redirectUri: `${window.location.origin}/oauth/callback` } : undefined,
      }
      const result = await connectMutation.mutateAsync({ serverId, config: configWithCorrectRedirect })
      setServerStatus(serverId, result)
      setLegacyStatus(result)
    } catch (error) {
      const errorStatus = { connected: false, error: error instanceof Error ? error.message : 'Connection failed after OAuth' }
      setServerStatus(serverId, errorStatus)
      setLegacyStatus(errorStatus)
    } finally {
      setServerConnecting(serverId, false)
    }
  }, [servers, setActiveServer, setServerConnecting, connectMutation, setServerStatus, setLegacyStatus])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthSuccess = params.get('oauth_success')
    const oauthError = params.get('oauth_error')
    if (oauthSuccess === 'true') {
      const pendingServerId = localStorage.getItem('mcp-pending-oauth-server')
      if (pendingServerId) {
        localStorage.removeItem('mcp-pending-oauth-server')
        window.history.replaceState({}, '', window.location.pathname)
        handleOAuthSuccess(pendingServerId)
      }
    } else if (oauthError) {
      window.history.replaceState({}, '', window.location.pathname)
      console.error('OAuth error:', oauthError)
    }
  }, [handleOAuthSuccess])

  useEffect(() => {
    if (activeServer) setLegacyStatus(activeServer.status)
    else setLegacyStatus({ connected: false })
  }, [activeServer, setLegacyStatus])

  useEffect(() => {
    if (autoReconnectAttempted.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('oauth_success') || params.get('oauth_error')) return
    const timer = setTimeout(async () => {
      autoReconnectAttempted.current = true
      for (const server of servers) {
        if (server.status.connected || server.isConnecting) continue
        if ((server.config.type === 'sse' || server.config.type === 'streamable-http') && server.config.oauth?.enabled) {
          setServerConnecting(server.id, true)
          try {
            const configWithCorrectRedirect = { ...server.config, oauth: { ...server.config.oauth, redirectUri: `${window.location.origin}/oauth/callback` } }
            const result = await connectMutation.mutateAsync({ serverId: server.id, config: configWithCorrectRedirect })
            if (result.oauth?.authorizationRequired) setServerStatus(server.id, { connected: false, oauth: result.oauth })
            else setServerStatus(server.id, result)
          } catch (error) {
            setServerStatus(server.id, { connected: false, error: error instanceof Error ? error.message : 'Auto-reconnect failed' })
          } finally {
            setServerConnecting(server.id, false)
          }
        }
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [servers, setServerConnecting, setServerStatus, connectMutation])

  useEffect(() => {
    if (!backendConnectedServers?.serverIds) return
    const syncServers = async () => {
      for (const server of servers) {
        const isBackendConnected = backendConnectedServers.serverIds.includes(server.id)
        const isFrontendConnected = server.status.connected
        if (isBackendConnected && !isFrontendConnected && !server.isConnecting) {
          try {
            const response = await fetch(`/api/status?serverId=${encodeURIComponent(server.id)}`)
            if (response.ok) { const status = await response.json(); setServerStatus(server.id, status) }
          } catch { setServerStatus(server.id, { connected: true }) }
        }
      }
    }
    syncServers()
  }, [backendConnectedServers, servers, setServerStatus])

  useKeyboardShortcuts({
    onToggleTheme: () => {},
    onToggleLogs: toggleExpanded,
    onClearLogs: () => { clearLogs(); clearServerLogs() },
    onSwitchToTools: () => setActiveTab('tools'),
    onSwitchToResources: () => setActiveTab('resources'),
    onSwitchToPrompts: () => setActiveTab('prompts'),
  })

  const handleConnect = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId)
    if (!server) return
    setServerConnecting(serverId, true)
    try {
      const configWithCorrectRedirect = { ...server.config, oauth: server.config.oauth ? { ...server.config.oauth, redirectUri: `${window.location.origin}/oauth/callback` } : undefined }
      const result = await connectMutation.mutateAsync({ serverId, config: configWithCorrectRedirect })
      if (result.oauth?.authorizationRequired && result.oauth?.authorizationUrl) {
        localStorage.setItem('mcp-pending-oauth-server', serverId)
        window.location.href = result.oauth.authorizationUrl
        return
      }
      setServerStatus(serverId, result)
      const currentActiveServerId = useServersStore.getState().activeServerId
      if (serverId === currentActiveServerId) setLegacyStatus(result)
    } catch (error) {
      const errorStatus = { connected: false, error: error instanceof Error ? error.message : 'Connection failed' }
      setServerStatus(serverId, errorStatus)
      const currentActiveServerId = useServersStore.getState().activeServerId
      if (serverId === currentActiveServerId) setLegacyStatus(errorStatus)
    } finally {
      setServerConnecting(serverId, false)
    }
  }

  const handleDisconnect = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId)
    if (!server) return
    try {
      await disconnectMutation.mutateAsync(serverId)
      setServerStatus(serverId, { connected: false })
      const currentActiveServerId = useServersStore.getState().activeServerId
      if (serverId === currentActiveServerId) setLegacyStatus({ connected: false })
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const handleSaveServer = (name: string, config: ServerConfig) => {
    if (editingServer) {
      updateServer(editingServer.id, { name })
      updateServerConfig(editingServer.id, config)
    } else {
      addServer({ name, config })
    }
    setShowServerModal(false)
    setEditingServer(null)
  }

  const handleDeleteServer = (serverId: string) => {
    if (confirm('Are you sure you want to delete this server?')) {
      removeServer(serverId)
    }
  }

  const getStatusColor = (server: Server) => {
    if (server.isConnecting) return 'bg-yellow-500'
    if (server.status.connected) return 'bg-green-500'
    if (server.status.error) return 'bg-red-500'
    return 'bg-slate-500'
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Tab bar with server selector */}
        <div className="shrink-0 border-b border-surface-700 bg-surface-900 flex items-center justify-between px-4">
          <TabsList className="h-11 bg-transparent">
            <TabsTrigger value="tools">
              <Wrench className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="resources">
              <FolderOpen className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <MessageSquare className="h-4 w-4 mr-2" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="h-4 w-4 mr-2" />
              Logs
              {logs.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {logs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Right side: server selector + status */}
          <div className="flex items-center gap-2">
            {/* Server selector dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowServerDropdown(!showServerDropdown)}
                className="flex items-center gap-2 h-8 px-3 rounded-md border border-surface-600 bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 transition-colors cursor-pointer"
              >
                <ServerIcon className="h-3.5 w-3.5 text-slate-400" />
                {activeServer ? (
                  <span className="flex items-center gap-2 max-w-[180px]">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(activeServer)}`} />
                    <span className="truncate">{activeServer.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-500">Select server</span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {showServerDropdown && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-surface-700 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider px-1">Servers</span>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditingServer(null)
                        setShowServerModal(true)
                        setShowServerDropdown(false)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {servers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No servers configured
                      </div>
                    ) : (
                      servers.map((server) => (
                        <div
                          key={server.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                            activeServer?.id === server.id ? 'bg-amber-accent/10' : 'hover:bg-surface-700'
                          }`}
                          onClick={() => { setActiveServer(server.id); setShowServerDropdown(false) }}
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(server)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-200 truncate">{server.name}</span>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">{server.config.type}</Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {server.config.type === 'stdio' ? server.config.command : server.config.url}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {server.status.connected ? (
                              <button className="p-1 rounded hover:bg-surface-600 text-red-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDisconnect(server.id) }} title="Disconnect">
                                <Unplug className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button className="p-1 rounded hover:bg-surface-600 text-green-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleConnect(server.id) }} disabled={server.isConnecting} title="Connect">
                                {server.isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            <button className="p-1 rounded hover:bg-surface-600 text-slate-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingServer(server); setShowServerModal(true); setShowServerDropdown(false) }} title="Edit">
                              <Settings className="h-3.5 w-3.5" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-600 text-red-400/70 hover:text-red-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteServer(server.id) }} title="Delete">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {connectedServers.length > 0 && (
              <Badge variant="success" className="gap-1">{connectedServers.length} connected</Badge>
            )}

            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(!showShortcuts)} className="h-8 w-8" title="Keyboard shortcuts">
                <Keyboard className="h-4 w-4" />
              </Button>
              {showShortcuts && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface-800 border border-surface-600 rounded-lg shadow-xl p-4 z-50">
                  <h3 className="font-medium mb-3 text-sm text-slate-200">Keyboard Shortcuts</h3>
                  <div className="space-y-2 text-xs">
                    {[['Toggle logs', '⌘L'], ['Clear logs', '⌘K'], ['Tools tab', '⌘1'], ['Resources tab', '⌘2'], ['Prompts tab', '⌘3']].map(([label, key]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-400">{label}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-700 rounded text-xs text-slate-300">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="tools" className="h-full overflow-hidden m-0">
            <ToolsTab />
          </TabsContent>
          <TabsContent value="resources" className="h-full overflow-hidden m-0">
            <ResourcesTab />
          </TabsContent>
          <TabsContent value="prompts" className="h-full overflow-hidden m-0">
            <PromptsTab />
          </TabsContent>
          <TabsContent value="logs" className="h-full overflow-hidden m-0">
            <LogsTab onClearLogs={clearServerLogs} />
          </TabsContent>
        </div>
      </Tabs>

      <ServerConfigModal
        open={showServerModal}
        onOpenChange={setShowServerModal}
        server={editingServer}
        onSave={handleSaveServer}
      />
    </div>
  )
}
