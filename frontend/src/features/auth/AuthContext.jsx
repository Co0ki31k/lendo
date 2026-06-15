import { createContext, useContext, useMemo, useState } from 'react'
import { authApi } from '../../api'
import { getStoredUser } from '../../lib/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [isInitializing] = useState(false)

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
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
    logout() {
      authApi.logout()
      setUser(null)
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
