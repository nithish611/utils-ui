import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const time = d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const ms = d.getMilliseconds().toString().padStart(3, '0')
  return `${time}.${ms}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function downloadAsFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface McpContent {
  type: string
  text?: string
  data?: string
  mimeType?: string
}

export interface McpResult {
  content?: McpContent[]
  isError?: boolean
  [key: string]: unknown
}

export interface ParsedMcpResult {
  data: unknown
  rawText: string
  isJson: boolean
  isError: boolean
  contentType: string
}

export function parseMcpResult(result: unknown): ParsedMcpResult {
  if (result === null || result === undefined) {
    return {
      data: null,
      rawText: '',
      isJson: false,
      isError: false,
      contentType: 'text',
    }
  }

  const mcpResult = result as McpResult
  if (mcpResult.content && Array.isArray(mcpResult.content) && mcpResult.content.length > 0) {
    const firstContent = mcpResult.content[0]
    const contentType = firstContent.type || 'text'
    const isError = mcpResult.isError === true
    
    if (firstContent.text !== undefined) {
      const rawText = firstContent.text
      
      try {
        const parsed = JSON.parse(rawText)
        return {
          data: parsed,
          rawText,
          isJson: true,
          isError,
          contentType,
        }
      } catch {
        return {
          data: rawText,
          rawText,
          isJson: false,
          isError,
          contentType,
        }
      }
    }
    
    if (firstContent.data !== undefined) {
      return {
        data: firstContent.data,
        rawText: `[Binary data: ${firstContent.mimeType || 'unknown type'}]`,
        isJson: false,
        isError,
        contentType,
      }
    }
    
    return {
      data: firstContent,
      rawText: JSON.stringify(firstContent, null, 2),
      isJson: false,
      isError,
      contentType,
    }
  }

  const rawText = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
  return {
    data: result,
    rawText,
    isJson: typeof result === 'object',
    isError: false,
    contentType: 'unknown',
  }
}
