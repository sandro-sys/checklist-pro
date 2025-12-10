import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Check, 
  X, 
  Zap, 
  Crown, 
  Rocket,
  Users,
  ClipboardList,
  BarChart3,
  Shield,
  Headphones,
  Clock,
  Building2,
  Star,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    description: 'Experimente grátis por 14 dias',
    price: 0,
    originalPrice: null,
    period: '14 dias grátis',
    icon: Clock,
    color: 'from-dark-600 to-dark-700',
    borderColor: 'border-dark-600',
    buttonClass: 'bg-dark-600 hover:bg-dark-500 text-white',
    popular: false,
    features: [
      { name: 'Até 3 checklists', included: true },
      { name: 'Até 2 colaboradores', included: true },
      { name: 'Categorias ilimitadas', included: true },
      { name: 'Execuções ilimitadas', included: true },
      { name: 'QR Code para checklists', included: true },
      { name: 'Histórico de 7 dias', included: true },
      { name: 'Relatórios básicos', included: false },
      { name: 'Suporte por email', included: false },
      { name: 'Chatbot de suporte', included: false },
      { name: 'Exportação de dados', included: false },
      { name: 'Mentoria especializada', included: false },
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Para pequenos negócios',
    price: 49.90,
    originalPrice: 79.90,
    period: '/mês',
    icon: Zap,
    color: 'from-primary-600 to-primary-700',
    borderColor: 'border-primary-500/50',
    buttonClass: 'bg-primary-500 hover:bg-primary-600 text-white',
    popular: false,
    features: [
      { name: 'Até 10 checklists', included: true },
      { name: 'Até 5 colaboradores', included: true },
      { name: 'Categorias ilimitadas', included: true },
      { name: 'Execuções ilimitadas', included: true },
      { name: 'QR Code para checklists', included: true },
      { name: 'Histórico de 30 dias', included: true },
      { name: 'Relatórios básicos', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Chatbot de suporte', included: true },
      { name: 'Exportação de dados', included: false },
      { name: 'Mentoria especializada', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para empresas em crescimento',
    price: 99.90,
    originalPrice: 149.90,
    period: '/mês',
    icon: Crown,
    color: 'from-accent-amber to-orange-500',
    borderColor: 'border-accent-amber/50',
    buttonClass: 'bg-gradient-to-r from-accent-amber to-orange-500 hover:from-amber-500 hover:to-orange-600 text-dark-900',
    popular: true,
    features: [
      { name: 'Checklists ilimitados', included: true },
      { name: 'Colaboradores ilimitados', included: true },
      { name: 'Categorias ilimitadas', included: true },
      { name: 'Execuções ilimitadas', included: true },
      { name: 'QR Code para checklists', included: true },
      { name: 'Histórico ilimitado', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Chatbot de suporte', included: true },
      { name: 'Exportação de dados', included: true },
      { name: 'Mentoria especializada', included: true },
    ]
  }
]

export default function Pricing() {
  const { company } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectPlan = async (plan) => {
    if (!company) {
      toast.error('Você precisa cadastrar uma empresa primeiro')
      return
    }

    setSelectedPlan(plan.id)
    setIsProcessing(true)

    try {
      if (plan.id === 'trial') {
        // Ativar trial diretamente
        await api.post('/payments/activate-trial')
        toast.success('Trial ativado! Você tem 14 dias para experimentar.')
        setIsProcessing(false)
      } else {
        // Criar assinatura no Mercado Pago
        const response = await api.post('/payments/subscribe', {
          plan_id: plan.id
        })
        
        // Em produção usa init_point, em sandbox usa sandbox_init_point
        const paymentUrl = response.data.init_point || response.data.sandbox_init_point
        
        if (paymentUrl) {
          toast.success(`Redirecionando para pagamento do plano ${plan.name}...`)
          // Redirecionar para a página de pagamento do Mercado Pago
          window.location.href = paymentUrl
        } else {
          throw new Error('URL de pagamento não recebida')
        }
      }
    } catch (error) {
      console.error('Erro ao processar plano:', error)
      toast.error(error.response?.data?.error || 'Erro ao processar. Tente novamente.')
      setIsProcessing(false)
    }
  }

  const calculateSavings = (original, current) => {
    if (!original) return null
    const savings = original - current
    const percentage = Math.round((savings / original) * 100)
    return { savings, percentage }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          Escolha o plano ideal para seu negócio
        </h1>
        <p className="text-dark-400 text-lg max-w-2xl mx-auto">
          Comece gratuitamente e escale conforme sua empresa cresce. 
          Todos os planos incluem suporte e atualizações.
        </p>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {PLANS.map((plan, index) => {
          const savings = calculateSavings(plan.originalPrice, plan.price)
          const Icon = plan.icon

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-dark-800/50 backdrop-blur-sm border ${plan.borderColor} rounded-2xl p-6 lg:p-8 ${
                plan.popular ? 'ring-2 ring-accent-amber/50 scale-105' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-accent-amber to-orange-500 text-dark-900 text-sm font-bold rounded-full shadow-lg">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{plan.name}</h2>
                <p className="text-dark-400 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plan.originalPrice && (
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-dark-500 line-through text-lg">
                      R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                      -{savings?.percentage}%
                    </span>
                  </div>
                )}
                <div className="flex items-end justify-center gap-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold text-white">Grátis</span>
                  ) : (
                    <>
                      <span className="text-dark-400 text-lg">R$</span>
                      <span className="text-4xl font-bold text-white">
                        {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                    </>
                  )}
                  <span className="text-dark-400 mb-1">{plan.period}</span>
                </div>
                {savings && (
                  <p className="text-green-400 text-sm mt-2">
                    Economia de R$ {savings.savings.toFixed(2).replace('.', ',')} por mês
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isProcessing && selectedPlan === plan.id}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${plan.buttonClass} ${
                  isProcessing && selectedPlan === plan.id ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {isProcessing && selectedPlan === plan.id ? (
                  'Processando...'
                ) : plan.id === 'trial' ? (
                  'Começar Trial Grátis'
                ) : (
                  'Assinar Agora'
                )}
              </button>

              {/* Features */}
              <div className="mt-8 space-y-3">
                <p className="text-sm font-medium text-dark-300 mb-4">O que está incluído:</p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-dark-700 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-dark-500" />
                      </div>
                    )}
                    <span className={feature.included ? 'text-dark-300' : 'text-dark-500'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* FAQ / Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-16 text-center"
      >
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Pagamento Seguro</h3>
            <p className="text-dark-400 text-sm">Seus dados protegidos com criptografia de ponta</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-accent-teal/20 rounded-xl flex items-center justify-center mb-3">
              <Headphones className="w-6 h-6 text-accent-teal" />
            </div>
            <h3 className="font-semibold text-white mb-1">Suporte Dedicado</h3>
            <p className="text-dark-400 text-sm">Equipe pronta para ajudar quando precisar</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-accent-amber/20 rounded-xl flex items-center justify-center mb-3">
              <Rocket className="w-6 h-6 text-accent-amber" />
            </div>
            <h3 className="font-semibold text-white mb-1">Cancele Quando Quiser</h3>
            <p className="text-dark-400 text-sm">Sem multas ou taxas de cancelamento</p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl max-w-2xl mx-auto">
          <p className="text-dark-400">
            Precisa de um plano personalizado para sua empresa? 
            <a href="mailto:contato@checklistpro.com" className="text-primary-400 hover:text-primary-300 ml-1">
              Entre em contato conosco
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

