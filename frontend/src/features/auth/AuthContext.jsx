import { createContext, useContext, useMemo, useState } from 'react'
import { authApi } from '../../api'
import { getAccessToken, getStoredUser, updateStoredUser } from '../../lib/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [isInitializing] = useState(false)

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
