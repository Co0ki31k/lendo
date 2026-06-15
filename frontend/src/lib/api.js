import axios from 'axios'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  storeAuthSession,
} from './tokenStorage'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:10000'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null
const authBypassUrls = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh']

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('Missing refresh token')
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/api/auth/refresh', { refresh_token: refreshToken })
      .then((response) => {
        storeAuthSession(response.data)
        return response.data.access_token
      })
      .catch((error) => {
        clearAuthSession()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url ?? ''

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (authBypassUrls.some((url) => requestUrl.includes(url))) {
      if (requestUrl.includes('/api/auth/refresh')) {
        clearAuthSession()
      }

      return Promise.reject(error)
    }

    try {
      originalRequest._retry = true
      const newAccessToken = await refreshAccessToken()
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)

export default api
