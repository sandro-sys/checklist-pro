import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      company: null,

      setLoading: (loading) => set({ isLoading: loading }),

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, accessToken, refreshToken } = response.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.error || 'Erro ao fazer login' 
          }
        }
      },

      register: async (data) => {
        try {
          const response = await api.post('/auth/register', data)
          const { user, accessToken, refreshToken } = response.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.error || 'Erro ao criar conta' 
          }
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get()
          await api.post('/auth/logout', { refreshToken })
        } catch (error) {
          console.error('Erro no logout:', error)
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            company: null
          })
          delete api.defaults.headers.common['Authorization']
        }
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get()
          if (!refreshToken) throw new Error('No refresh token')
          
          const response = await api.post('/auth/refresh', { refreshToken })
          const { accessToken } = response.data
          
          set({ accessToken })
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return accessToken
        } catch (error) {
          get().logout()
          throw error
        }
      },

      fetchUser: async () => {
        try {
          const { accessToken } = get()
          if (!accessToken) {
            set({ isLoading: false })
            return
          }
          
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          const response = await api.get('/auth/me')
          
          set({ 
            user: response.data, 
            isAuthenticated: true,
            isLoading: false 
          })
        } catch (error) {
          if (error.response?.status === 403) {
            try {
              await get().refreshAccessToken()
              await get().fetchUser()
            } catch {
              set({ isLoading: false })
            }
          } else {
            set({ isLoading: false })
          }
        }
      },

      setCompany: (company) => set({ company }),

      initialize: async () => {
        const { accessToken } = get()
        if (accessToken) {
          await get().fetchUser()
        } else {
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user
      })
    }
  )
)

// Initialize on app load
useAuthStore.getState().initialize()

