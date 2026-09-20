import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS } from '@/constants/auth'
import { API_ENDPOINTS } from '@/constants/api'
import { AuthResponse } from '@/types/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Mutex & queue for silent token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request Interceptor: Attach JWT Access Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response Interceptor: Handle 401 & Silent Token Refresh
axiosClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const isAuthEndpoint =
      originalRequest.url?.includes(API_ENDPOINTS.LOGIN) ||
      originalRequest.url?.includes(API_ENDPOINTS.REFRESH) ||
      originalRequest.url?.includes(API_ENDPOINTS.REGISTER)

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      if (!refreshToken) {
        handleLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosClient(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post<AuthResponse>(
          `${baseURL}${API_ENDPOINTS.REFRESH}`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )

        const { accessToken, refreshToken: newRefreshToken, user } = response.data

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
        if (newRefreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
        }
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
        }

        axiosClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return axiosClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        handleLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

const handleLogout = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  // Dispatch a custom event so Zustand auth store can react without circular dependencies
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

export default axiosClient
