import { create } from 'zustand'
import { UserSummary, LoginRequest, RegisterRequest } from '@/types/auth'
import { STORAGE_KEYS } from '@/constants/auth'
import { authService } from '@/services/auth/authService'

interface AuthState {
  user: UserSummary | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  initAuth: () => Promise<void>
}

const getStoredUser = (): UserSummary | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen to forced logout events from axios interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    })
  }

  return {
    user: getStoredUser(),
    accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    isLoading: false,
    isInitialized: false,

    login: async (payload: LoginRequest) => {
      set({ isLoading: true })
      try {
        const response = await authService.login(payload)
        const { accessToken, refreshToken, user } = response

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        set({ isLoading: false })
        throw error
      }
    },

    register: async (payload: RegisterRequest) => {
      set({ isLoading: true })
      try {
        await authService.register(payload)
        set({ isLoading: false })
      } catch (error) {
        set({ isLoading: false })
        throw error
      }
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    },

    fetchCurrentUser: async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        const userSummary: UserSummary = {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          role: currentUser.role,
        }
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userSummary))
        set({ user: userSummary, isAuthenticated: true })
      } catch {
        get().logout()
      }
    },

    initAuth: async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      if (token) {
        try {
          await get().fetchCurrentUser()
        } catch {
          get().logout()
        }
      }
      set({ isInitialized: true })
    },
  }
})
