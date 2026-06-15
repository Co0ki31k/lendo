import api from '../lib/api'
import {
  clearAuthSession,
  getStoredUser,
  storeAuthSession,
} from '../lib/tokenStorage'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:10000'

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
  const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken })
  storeAuthSession(response.data)
  return response.data
}

export function logout() {
  clearAuthSession()
}

export function getCurrentUser() {
  return getStoredUser()
}

export function getGoogleOAuthAuthorizeUrl() {
  return `${apiBaseUrl}/oauth2/authorize/google`
}

export function startGoogleOAuthLogin() {
  window.location.assign(getGoogleOAuthAuthorizeUrl())
}

export function completeOAuthLoginFromUrl(url = window.location.href) {
  const currentUrl = new URL(url)
  const accessToken = currentUrl.searchParams.get('token')
  const refreshToken = currentUrl.searchParams.get('refresh_token')
  const error = currentUrl.searchParams.get('error')

  if (error) {
    throw new Error(error)
  }

  if (!accessToken || !refreshToken) {
    throw new Error('OAuth callback is missing required tokens')
  }

  const authSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
  }

  storeAuthSession(authSession)

  return authSession
}
