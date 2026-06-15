import { buildUserFromAccessToken } from './jwt'

const ACCESS_TOKEN_KEY = 'lendo.accessToken'
const REFRESH_TOKEN_KEY = 'lendo.refreshToken'
const USER_KEY = 'lendo.user'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getAccessToken() {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser() {
  if (!isBrowser()) {
    return null
  }

  const user = window.localStorage.getItem(USER_KEY)

  if (!user) {
    return null
  }

  try {
    return JSON.parse(user)
  } catch {
    return null
  }
}

export function storeAuthSession(authResponse) {
  if (!isBrowser() || !authResponse) {
    return
  }

  const accessToken = authResponse.access_token
  const refreshToken = authResponse.refresh_token
  const user = authResponse.user ?? buildUserFromAccessToken(accessToken)

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}
