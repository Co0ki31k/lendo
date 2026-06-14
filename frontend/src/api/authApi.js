import api from '../lib/api'
import {
  clearAuthSession,
  getStoredUser,
  storeAuthSession,
} from '../lib/tokenStorage'

export async function login(credentials) {
  const response = await api.post('/api/auth/login', credentials)
  storeAuthSession(response.data)
  return response.data
}

export async function register(payload) {
  const response = await api.post('/api/auth/register', payload)
  storeAuthSession(response.data)
  return response.data
}

export async function refreshAuth(refreshToken) {
  const response = await api.post('/api/auth/refresh', { refreshToken })
  storeAuthSession(response.data)
  return response.data
}

export function logout() {
  clearAuthSession()
}

export function getCurrentUser() {
  return getStoredUser()
}
