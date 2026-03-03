import { Link } from 'lucide-react'
import { registerUtility } from '../registry'
import UrlCodecPage from './components/UrlCodecPage'

registerUtility({
  id: 'url-codec',
  name: 'URL Tools',
  description: 'Parse, encode, and decode URLs',
  icon: Link,
  route: '/url',
  component: UrlCodecPage,
  order: 8,
})
