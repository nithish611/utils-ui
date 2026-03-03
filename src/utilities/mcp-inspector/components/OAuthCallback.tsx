import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useOAuthCallback } from '../hooks/useApi'
import { useConnectionStore } from '../stores/connectionStore'

interface OAuthCallbackProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function OAuthCallback({ onSuccess, onError }: OAuthCallbackProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const oauthCallbackMutation = useOAuthCallback()
  const { config, setStatus: setConnectionStatus } = useConnectionStore()
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      if (error) {
        const message = errorDescription || error
        setStatus('error')
        setErrorMessage(message)
        onError?.(message)
        setTimeout(() => {
          window.location.href = `/?oauth_error=${encodeURIComponent(message)}`
        }, 2000)
        return
      }

      if (!code || !state) {
        const message = 'Missing authorization code or state parameter'
        setStatus('error')
        setErrorMessage(message)
        onError?.(message)
        setTimeout(() => {
          window.location.href = `/?oauth_error=${encodeURIComponent(message)}`
        }, 2000)
        return
      }

      try {
        await oauthCallbackMutation.mutateAsync({
          code,
          state,
          redirectUri: config.oauth?.redirectUri,
          clientId: config.oauth?.clientId,
          clientSecret: config.oauth?.clientSecret,
          scopes: config.oauth?.scopes,
        })

        setStatus('success')
        onSuccess?.()

        setConnectionStatus({
          connected: false,
          oauth: { authenticated: true },
        })

        setTimeout(() => {
          window.location.href = '/?oauth_success=true'
        }, 1500)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Token exchange failed'
        setStatus('error')
        setErrorMessage(message)
        onError?.(message)
        setTimeout(() => {
          window.location.href = `/?oauth_error=${encodeURIComponent(message)}`
        }, 2000)
      }
    }

    processCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-surface-900 rounded-xl border border-surface-700 shadow-xl p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-amber-accent animate-spin" />
              <h2 className="text-xl font-semibold mb-2 text-slate-100">Processing Authorization</h2>
              <p className="text-slate-400">
                Please wait while we complete the authorization...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2 text-green-400">
                Authorization Successful
              </h2>
              <p className="text-slate-400">
                You have been authorized. Redirecting back to the application...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-xl font-semibold mb-2 text-red-400">
                Authorization Failed
              </h2>
              <p className="text-slate-400 mb-4">{errorMessage}</p>
              <p className="text-sm text-slate-500">
                Redirecting back to the application...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function OAuthCallbackPage() {
  return <OAuthCallback />
}

export default OAuthCallback
