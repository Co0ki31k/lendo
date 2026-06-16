import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../../api'
import { getAccessToken, getRefreshToken, getStoredUser, updateStoredUser } from '../../lib/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [isInitializing, setIsInitializing] = useState(Boolean(getRefreshToken()))

  useEffect(() => {
    let isMounted = true

    async function initializeSession() {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        if (isMounted) {
          setIsInitializing(false)
        }
        return
      }

      try {
        const authResponse = await authApi.refreshAuth(refreshToken)

        if (!isMounted) {
          return
        }

        setUser(authResponse.user ?? authApi.getCurrentUser())
      } catch {
        if (!isMounted) {
          return
        }

        authApi.logout()
        setUser(null)
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    void initializeSession()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user) || Boolean(getAccessToken()),
    isInitializing,
    async login(credentials) {
      const authResponse = await authApi.login(credentials)
      setUser(authResponse.user)
      return authResponse
    },
    async register(payload) {
      const authResponse = await authApi.register(payload)
      setUser(authResponse.user)
      return authResponse
    },
    completeOAuthLogin(url) {
      const authSession = authApi.completeOAuthLoginFromUrl(url)
      setUser(authApi.getCurrentUser())
      return authSession
    },
    startGoogleOAuthLogin() {
      authApi.startGoogleOAuthLogin()
    },
    logout() {
      authApi.logout()
      setUser(null)
    },
    updateCurrentUser(patch) {
      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser
        }

        const nextUser = {
          ...currentUser,
          ...patch,
        }

        updateStoredUser(nextUser)
        return nextUser
      })
    },
    syncStoredUser() {
      setUser(getStoredUser())
    },
  }), [isInitializing, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
