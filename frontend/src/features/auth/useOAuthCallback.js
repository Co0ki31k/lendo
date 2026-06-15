import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

export function useOAuthCallback() {
  const { completeOAuthLogin, isInitializing } = useAuth()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isInitializing) {
      return
    }

    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('processing')
      completeOAuthLogin(window.location.href)
      setStatus('success')
    } catch (callbackError) {
      setError(callbackError.message || 'Nie udalo sie dokonczyc logowania Google')
      setStatus('error')
    }
  }, [completeOAuthLogin, isInitializing])

  return {
    status,
    error,
  }
}
