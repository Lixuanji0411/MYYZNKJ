import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginCredentials, RegisterData } from '@/types/auth'
import { authService } from '@/services/auth.service'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await authService.login(credentials)
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : '登录失败'
          set({ isLoading: false, error: message })
          throw err
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await authService.register(data)
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : '注册失败'
          set({ isLoading: false, error: message })
          throw err
        }
      },

      logout: async () => {
        await authService.logout()
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          const user = await authService.updateProfile(updates)
          set({ user })
        } catch (err) {
          const message = err instanceof Error ? err.message : '更新失败'
          set({ error: message })
        }
      },

      checkAuth: async () => {
        const user = await authService.getCurrentUser()
        const token = await authService.getToken()
        if (user && token) {
          set({ user, token, isAuthenticated: true })
        } else {
          set({ user: null, token: null, isAuthenticated: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'znjz_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
