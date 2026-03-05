import { create } from 'zustand'
import api from '../services/api'

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  isLoading: true,
  hasActivePlan: false,
  planType: null,
  daysRemaining: null,

  fetchSubscription: async () => {
    try {
      set({ isLoading: true })
      const response = await api.get('/payments/subscription')
      const data = response.data
      
      const hasActivePlan = data.plan && !data.is_expired && 
        (data.plan !== 'none' || data.plan === 'trial')
      
      let daysRemaining = null
      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at)
        const now = new Date()
        daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
      }
      
      set({
        subscription: data,
        hasActivePlan,
        planType: data.plan,
        daysRemaining,
        isLoading: false
      })
      
      return data
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error)
      set({
        subscription: null,
        hasActivePlan: false,
        planType: null,
        daysRemaining: null,
        isLoading: false
      })
      return null
    }
  },

  clearSubscription: () => {
    set({
      subscription: null,
      hasActivePlan: false,
      planType: null,
      daysRemaining: null,
      isLoading: false
    })
  }
}))
