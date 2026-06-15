const backendFieldMap = {
  email: 'email',
  password: 'password',
  firstName: 'firstName',
  lastName: 'lastName',
  phoneNumber: 'phoneNumber',
  refresh_token: 'refreshToken',
}

function extractMessage(error) {
  const responseData = error?.response?.data

  if (typeof responseData === 'string') {
    return responseData
  }

  if (responseData?.message) {
    return responseData.message
  }

  if (error?.message) {
    return error.message
  }

  return 'Wystapil nieoczekiwany blad'
}

function parseFieldErrors(message) {
  return message
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((fieldErrors, entry) => {
      const separatorIndex = entry.indexOf(':')

      if (separatorIndex === -1) {
        return fieldErrors
      }

      const backendFieldName = entry.slice(0, separatorIndex).trim()
      const normalizedFieldName = backendFieldMap[backendFieldName]

      if (!normalizedFieldName) {
        return fieldErrors
      }

      fieldErrors[normalizedFieldName] = entry.slice(separatorIndex + 1).trim()
      return fieldErrors
    }, {})
}

export function normalizeAuthError(error) {
  const message = extractMessage(error)
  const fieldErrors = parseFieldErrors(message)

  return {
    message,
    fieldErrors,
  }
}
