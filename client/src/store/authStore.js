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
          const { refreshToken, user: currentUser } = get()
          if (!refreshToken) throw new Error('No refresh token')
          
          const response = await api.post('/auth/refresh', { refreshToken })
          const { accessToken, user: updatedUser } = response.data
          
          set({ 
            accessToken,
            user: updatedUser ? { ...currentUser, ...updatedUser } : currentUser
          })
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          
          return accessToken
        } catch (error) {
          get().logout()
          throw error
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          await api.post('/auth/change-password', { currentPassword, newPassword })
          
          // Atualizar usuario para remover flag must_change_password
          const { user } = get()
          if (user) {
            set({ user: { ...user, must_change_password: false } })
          }
          
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.error || 'Erro ao trocar senha' 
          }
        }
      },

      clearMustChangePassword: () => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, must_change_password: false } })
        }
      },

      fetchUser: async () => {
        try {
          const { accessToken, refreshToken } = get()
          if (!accessToken) {
            set({ isLoading: false, isAuthenticated: false })
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
          const { refreshToken: rToken } = get()
          // Se o token expirou e temos refresh token, tenta renovar
          if (error.response?.status === 403 && rToken) {
            try {
              await get().refreshAccessToken()
              await get().fetchUser()
            } catch {
              // Falhou o refresh, limpa tudo
              set({ 
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false 
              })
              delete api.defaults.headers.common['Authorization']
            }
          } else {
            // Qualquer outro erro, limpa a autenticação
            set({ 
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false 
            })
            delete api.defaults.headers.common['Authorization']
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

