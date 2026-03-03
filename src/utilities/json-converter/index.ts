import { Braces } from 'lucide-react'
import { registerUtility } from '../registry'
import JsonConverterPage from './components/JsonConverterPage'

registerUtility({
  id: 'json-converter',
  name: 'JSON Converter',
  description: 'Convert JSON to JS objects, TypeScript, and more',
  icon: Braces,
  route: '/json-converter',
  component: JsonConverterPage,
  order: 3,
})
