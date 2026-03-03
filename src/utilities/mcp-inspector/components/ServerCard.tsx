import {
    Globe,
    Loader2,
    MoreVertical,
    Pencil,
    Plug,
    Radio,
    Terminal,
    Trash2,
    Unplug,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import type { Server } from '../stores/serversStore'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface ServerCardProps {
  server: Server
  isActive: boolean
  onSelect: () => void
  onConnect: () => void
  onDisconnect: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ServerCard({
  server,
  isActive,
  onSelect,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
}: ServerCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getTransportIcon = () => {
    switch (server.config.type) {
      case 'stdio':
        return <Terminal className="h-4 w-4" />
      case 'sse':
        return <Radio className="h-4 w-4" />
      case 'streamable-http':
        return <Globe className="h-4 w-4" />
      default:
        return <Terminal className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    if (server.isConnecting) return 'bg-yellow-500'
    if (server.status.connected) return 'bg-green-500'
    if (server.status.error && !server.status.oauth?.authorizationRequired) return 'bg-red-500'
    if (server.status.oauth?.authorizationRequired) return 'bg-yellow-500'
    return 'bg-slate-500'
  }

  const getStatusText = () => {
    if (server.isConnecting) return 'Connecting...'
    if (server.status.connected) return 'Connected'
    if (server.status.oauth?.authorizationRequired) return 'Authorizing...'
    if (server.status.error) return 'Error'
    return 'Disconnected'
  }

  const getServerUrl = () => {
    if (server.config.type === 'stdio') {
      return server.config.command || 'No command'
    }
    return server.config.url || 'No URL'
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border p-3 cursor-pointer transition-all',
        isActive
          ? 'border-amber-accent bg-amber-accent/5 ring-1 ring-amber-accent'
          : 'border-surface-700 hover:border-amber-accent/50 hover:bg-surface-800/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', getStatusColor())} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate text-slate-200">{server.name}</span>
            {server.status.connected && server.status.serverInfo && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                v{server.status.serverInfo.version}
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-500 truncate mt-0.5">
            {getServerUrl()}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1">
              {getTransportIcon()}
              {server.config.type}
            </Badge>
            <span className="text-xs text-slate-400">{getStatusText()}</span>
          </div>

          {server.status.error && !server.status.oauth?.authorizationRequired && (
            <p className="text-xs text-red-400 mt-1 truncate">
              {server.status.error}
            </p>
          )}

          {server.status.connected && server.status.capabilities && (
            <div className="flex gap-1 mt-2">
              {server.status.capabilities.tools && (
                <Badge variant="info" className="text-xs px-1.5 py-0">Tools</Badge>
              )}
              {server.status.capabilities.resources && (
                <Badge variant="info" className="text-xs px-1.5 py-0">Resources</Badge>
              )}
              {server.status.capabilities.prompts && (
                <Badge variant="info" className="text-xs px-1.5 py-0">Prompts</Badge>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {server.status.connected ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onDisconnect()
              }}
              title="Disconnect"
            >
              <Unplug className="h-4 w-4 text-red-400" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onConnect()
              }}
              disabled={server.isConnecting}
              title="Connect"
            >
              {server.isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plug className="h-4 w-4 text-green-500" />
              )}
            </Button>
          )}

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-800 border border-surface-600 rounded-md shadow-xl py-1 min-w-[120px]">
                  <button
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-700 flex items-center gap-2 text-slate-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit()
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-700 flex items-center gap-2 text-red-400 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete()
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
