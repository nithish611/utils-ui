import { Cable } from 'lucide-react'
import { registerUtility } from '../registry'
import MCPInspectorPage from './MCPInspectorPage'

registerUtility({
  id: 'mcp-inspector',
  name: 'MCP Inspector',
  description: 'Connect to and inspect MCP servers',
  icon: Cable,
  route: '/mcp-inspector',
  component: MCPInspectorPage,
  order: 2,
})
