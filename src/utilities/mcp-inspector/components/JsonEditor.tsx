import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'

interface JsonEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  height?: string | number
  schema?: object
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  height = '200px',
  schema,
}: JsonEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    if (schema) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: 'http://myserver/schema.json',
            fileMatch: ['*'],
            schema,
          },
        ],
      })
    }
  }

  const handleChange = (newValue: string | undefined) => {
    if (onChange && newValue !== undefined) {
      onChange(newValue)
    }
  }

  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== value) {
        editorRef.current.setValue(value)
      }
    }
  }, [value])

  const isPercentageHeight = typeof height === 'string' && height.includes('%')
  
  return (
    <div 
      className="rounded-md border border-surface-600 overflow-hidden"
      style={isPercentageHeight ? { height, display: 'flex', flexDirection: 'column' } : undefined}
    >
      <Editor
        height={isPercentageHeight ? '100%' : height}
        defaultLanguage="json"
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: 'on',
          folding: true,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          stickyScroll: { enabled: false },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
        }}
      />
    </div>
  )
}
