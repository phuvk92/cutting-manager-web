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

export const forceLogoutAndRedirect = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:logout'))
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }
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
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401) {
      const url = originalRequest?.url || ''
      const isLoginEndpoint = url.includes(API_ENDPOINTS.LOGIN)

      // Nếu lỗi 401 do sai mật khẩu lúc đăng nhập thì để LoginForm tự hiển thị thông báo lỗi
      if (isLoginEndpoint) {
        return Promise.reject(error)
      }

      // Nếu chính endpoint refresh token trả về 401 -> Refresh token hết hạn / không hợp lệ
      const isRefreshEndpoint = url.includes(API_ENDPOINTS.REFRESH)
      if (isRefreshEndpoint) {
        forceLogoutAndRedirect()
        return Promise.reject(error)
      }

      // Đã retry refresh 1 lần rồi mà vẫn 401 -> Logout ngay
      if (originalRequest?._retry) {
        forceLogoutAndRedirect()
        return Promise.reject(error)
      }

      // Thử refresh token
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      if (!refreshToken) {
        forceLogoutAndRedirect()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            if (originalRequest && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return axiosClient(originalRequest)
            }
            return Promise.reject(error)
          })
          .catch(err => {
            forceLogoutAndRedirect()
            return Promise.reject(err)
          })
      }

      if (originalRequest) {
        originalRequest._retry = true
      }
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

        if (originalRequest && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return axiosClient(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        forceLogoutAndRedirect()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosClient
