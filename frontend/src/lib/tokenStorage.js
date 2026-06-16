import { buildUserFromAccessToken } from './jwt'

const ACCESS_TOKEN_KEY = 'lendo.accessToken'
const REFRESH_TOKEN_KEY = 'lendo.refreshToken'
const USER_KEY = 'lendo.user'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isBrowser() {
  return typeof window !== 'undefined'
}

function isJwtToken(value) {
  return typeof value === 'string' && value.split('.').length === 3
}

function isRefreshToken(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function readStoredTokens() {
  if (!isBrowser()) {
    return { accessToken: null, refreshToken: null }
  }

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)

  if (isJwtToken(accessToken) || isRefreshToken(refreshToken)) {
    return { accessToken, refreshToken }
  }

  if (isRefreshToken(accessToken) && isJwtToken(refreshToken)) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, refreshToken)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, accessToken)

    return {
      accessToken: refreshToken,
      refreshToken: accessToken,
    }
  }

  return { accessToken, refreshToken }
}

export function getAccessToken() {
  return readStoredTokens().accessToken
}

export function getRefreshToken() {
  return readStoredTokens().refreshToken
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

  if (isJwtToken(accessToken)) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }

  if (isRefreshToken(refreshToken)) {
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

export function updateStoredUser(nextUser) {
  if (!isBrowser() || !nextUser) {
    return
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
}
