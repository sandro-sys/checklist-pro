import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CreditCard, Clock, Loader2, Lock } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function RequirePlan({ children }) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [error, setError] = useState(null)

  // Master tem acesso total, não precisa verificar plano
  const isMaster = user?.is_master

  useEffect(() => {
    if (isMaster) {
      setLoading(false)
      return
    }
    checkSubscription()
  }, [isMaster])

  const checkSubscription = async () => {
    try {
      setLoading(true)
      const response = await api.get('/payments/subscription')
      setSubscription(response.data)
    } catch (err) {
      console.error('Erro ao verificar assinatura:', err)
      setError('Erro ao verificar plano')
    } finally {
      setLoading(false)
    }
  }

  // Master sempre tem acesso
  if (isMaster) {
    return children
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Erro ao verificar plano</h2>
        <p className="text-dark-400 mb-6">{error}</p>
        <button
          onClick={checkSubscription}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const isBlocked = subscription?.is_blocked === true
  const hasActivePlan = subscription?.is_active === true

  if (isBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Acesso Bloqueado</h2>
        <p className="text-dark-400 max-w-md mb-6">
          O acesso desta empresa foi suspenso. Entre em contato com o suporte para mais informações.
        </p>
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  if (!hasActivePlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
          <CreditCard className="w-10 h-10 text-amber-500" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Plano Necessário
        </h2>

        <p className="text-dark-400 max-w-md mb-6">
          Para acessar esta funcionalidade, você precisa ter um plano ativo.
          Escolha um plano que atenda às necessidades do seu negócio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/pricing"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all"
          >
            <CreditCard className="w-5 h-5" />
            Ver Planos
          </Link>

          <Link
            to="/dashboard"
            className="px-6 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
          >
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="mt-8 p-4 bg-dark-800/50 border border-dark-700 rounded-xl max-w-md">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Experimente grátis!</span>
          </div>
          <p className="text-dark-400 text-sm">
            Comece com o Trial de 14 dias e teste todas as funcionalidades sem compromisso.
          </p>
        </div>
      </div>
    )
  }

  return children
}
