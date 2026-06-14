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

  return user ? JSON.parse(user) : null
}

export function storeAuthSession(authResponse) {
  if (!isBrowser() || !authResponse) {
    return
  }

  if (authResponse.access_token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.access_token)
  }

  if (authResponse.refresh_token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refresh_token)
  }

  if (authResponse.user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user))
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
