import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { OAuthCallbackPage } from './utilities/mcp-inspector/components/OAuthCallback'
import { getUtilities } from './utilities/registry'

import './utilities/aws-launcher'
import './utilities/base64-codec'
import './utilities/epoch-converter'
import './utilities/json-converter'
import './utilities/mcp-inspector'
import './utilities/text-diff'
import './utilities/url-codec'
import './utilities/uuid-generator'

export default function App() {
  const utilities = getUtilities()

  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route element={<AppShell />}>
        {utilities.map((util) => (
          <Route key={util.id} path={util.route} element={<util.component />} />
        ))}
        <Route path="/" element={<Navigate to="/aws-launcher" replace />} />
        <Route path="*" element={<Navigate to="/aws-launcher" replace />} />
      </Route>
    </Routes>
  )
}
