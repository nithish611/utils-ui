export type OutputFormat = 'formatted' | 'minified' | 'js-object' | 'typescript'

function valueToJS(value: unknown, indent: number, currentIndent: number): string {
  const pad = ' '.repeat(currentIndent)
  const innerPad = ' '.repeat(currentIndent + indent)

  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((v) => `${innerPad}${valueToJS(v, indent, currentIndent + indent)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const lines = entries.map(([key, val]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
      return `${innerPad}${safeKey}: ${valueToJS(val, indent, currentIndent + indent)}`
    })
    return `{\n${lines.join(',\n')}\n${pad}}`
  }

  return String(value)
}

function valueToTS(value: unknown, indent: number, currentIndent: number): string {
  const pad = ' '.repeat(currentIndent)
  const innerPad = ' '.repeat(currentIndent + indent)

  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((v) => `${innerPad}${valueToTS(v, indent, currentIndent + indent)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const lines = entries.map(([key, val]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
      return `${innerPad}${safeKey}: ${valueToTS(val, indent, currentIndent + indent)}`
    })
    return `{\n${lines.join(',\n')}\n${pad}}`
  }

  return String(value)
}

function inferTSType(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const types = [...new Set(value.map(inferTSType))]
    return types.length === 1 ? `${types[0]}[]` : `(${types.join(' | ')})[]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return 'Record<string, unknown>'
    const lines = entries.map(([key, val]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
      return `  ${safeKey}: ${inferTSType(val)}`
    })
    return `{\n${lines.join('\n')}\n}`
  }

  return 'unknown'
}

/**
 * Recursively unwrap stringified JSON. If a parsed value is a string that
 * itself looks like JSON (starts with { or [), keep parsing until we reach
 * the actual object/array. This handles double/triple-stringified payloads.
 */
function deepUnstringify(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const t = value.trim()
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try {
      const inner = JSON.parse(t)
      return deepUnstringify(inner)
    } catch {
      return value
    }
  }
  return value
}

/**
 * Try to parse the input as JSON. If the raw parse yields a string
 * (i.e. the input was a JSON-stringified string like `"{\"a\":1}"`),
 * recursively unwrap it. Also handles inputs that aren't wrapped in
 * quotes but contain escaped characters — we try wrapping in quotes
 * and parsing that way as a fallback.
 */
export function smartParseInput(input: string): unknown {
  return smartParse(input)
}

function smartParse(input: string): unknown {
  const trimmed = input.trim()

  // 1. Standard JSON.parse
  try {
    const parsed = JSON.parse(trimmed)
    return deepUnstringify(parsed)
  } catch {
    // continue to fallbacks
  }

  // 2. Input looks like an escaped JSON string without outer quotes
  //    e.g. {\"name\":\"John\"} — wrap in quotes and try again
  if (trimmed.includes('\\"') || trimmed.includes('\\\\')) {
    try {
      const wrapped = JSON.parse(`"${trimmed}"`)
      return deepUnstringify(wrapped)
    } catch {
      // continue
    }
  }

  // 3. Input has literal backslash-quote sequences from copy-paste
  //    e.g. {\"name\":\"John\"} as literal characters (not escape sequences)
  const unescaped = trimmed
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
  try {
    const parsed = JSON.parse(unescaped)
    return deepUnstringify(parsed)
  } catch {
    // continue
  }

  throw new Error('Unable to parse as JSON')
}

export interface ConvertResult {
  output: string
  error: string | null
}

export function convert(input: string, format: OutputFormat): ConvertResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { output: '', error: null }
  }

  try {
    const parsed = smartParse(trimmed)

    switch (format) {
      case 'formatted':
        return {
          output: JSON.stringify(parsed, null, 2),
          error: null,
        }

      case 'minified':
        return {
          output: JSON.stringify(parsed),
          error: null,
        }

      case 'js-object':
        return {
          output: `const data = ${valueToJS(parsed, 2, 0)}`,
          error: null,
        }

      case 'typescript': {
        const typeStr = inferTSType(parsed)
        const valueStr = valueToTS(parsed, 2, 0)
        return {
          output: `interface Data ${typeStr}\n\nconst data: Data = ${valueStr}`,
          error: null,
        }
      }

      default:
        return { output: '', error: 'Unknown format' }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON'
    return { output: '', error: msg }
  }
}
