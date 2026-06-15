function decodeBase64Url(value) {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalizedValue.length % 4
  const base64Value = padding ? normalizedValue + '='.repeat(4 - padding) : normalizedValue

  return window.atob(base64Value)
}

export function decodeJwt(token) {
  if (!token) {
    return null
  }

  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]))
  } catch {
    return null
  }
}

export function buildUserFromAccessToken(accessToken) {
  const payload = decodeJwt(accessToken)

  if (!payload?.sub) {
    return null
  }

  return {
    id: null,
    email: payload.sub,
    firstName: null,
    lastName: null,
    phoneNumber: null,
    role: payload.role ?? 'CLIENT',
    isActive: true,
  }
}
