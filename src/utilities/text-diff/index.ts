import { GitCompareArrows } from 'lucide-react'
import { registerUtility } from '../registry'
import TextDiffPage from './components/TextDiffPage'

registerUtility({
  id: 'text-diff',
  name: 'Code Diff',
  description: 'Compare code with syntax highlighting and diff view',
  icon: GitCompareArrows,
  route: '/diff',
  component: TextDiffPage,
  order: 7,
})
