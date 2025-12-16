import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckSquare, 
  CheckCircle2, 
  Circle,
  Loader2,
  Send,
  AlertCircle,
  Building2,
  Clock,
  User,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  MinusCircle,
  Ban,
  Share2,
  Download,
  X,
  MessageCircle
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ChecklistExecute() {
  const { checklistId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, login } = useAuthStore()
  
  const [checklist, setChecklist] = useState(null)
  const [execution, setExecution] = useState(null)
  const [responses, setResponses] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Share state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [isLoadingShare, setIsLoadingShare] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [completedExecutionId, setCompletedExecutionId] = useState(null)

  useEffect(() => {
    fetchChecklist()
  }, [checklistId])

  const fetchChecklist = async () => {
    try {
      const response = await api.get(`/checklists/public/${checklistId}`)
      setChecklist(response.data)
      
      // Initialize responses
      const initialResponses = {}
      response.data.items.forEach(item => {
        initialResponses[item.id] = { is_checked: false, is_not_applicable: false, notes: '' }
      })
      setResponses(initialResponses)
    } catch (error) {
      toast.error('Checklist não encontrado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!loginData.email || !loginData.password) {
      toast.error('Preencha email e senha')
      return
    }

    setIsLoggingIn(true)
    const result = await login(loginData.email, loginData.password)
    setIsLoggingIn(false)

    if (result.success) {
      toast.success('Login realizado!')
      setShowLoginForm(false)
    } else {
      toast.error(result.error)
    }
  }

  const startExecution = async () => {
    if (!isAuthenticated) {
      setShowLoginForm(true)
      return
    }

    try {
      const response = await api.post('/executions/start', {
        checklist_id: checklistId
      })
      setExecution(response.data.execution)
      toast.success('Execução iniciada!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao iniciar execução')
    }
  }

  const toggleItem = async (itemId) => {
    if (!execution) return

    const newValue = !responses[itemId]?.is_checked
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], is_checked: newValue, is_not_applicable: false }
    }))

    try {
      await api.post(`/executions/${execution.id}/responses`, {
        item_id: itemId,
        is_checked: newValue,
        is_not_applicable: false
      })
    } catch (error) {
      // Revert on error
      setResponses(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], is_checked: !newValue }
      }))
      toast.error('Erro ao salvar resposta')
    }
  }

  const toggleNotApplicable = async (itemId, e) => {
    e.stopPropagation()
    if (!execution) return

    const newValue = !responses[itemId]?.is_not_applicable
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], is_not_applicable: newValue, is_checked: false }
    }))

    try {
      await api.post(`/executions/${execution.id}/responses`, {
        item_id: itemId,
        is_checked: false,
        is_not_applicable: newValue
      })
    } catch (error) {
      // Revert on error
      setResponses(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], is_not_applicable: !newValue }
      }))
      toast.error('Erro ao salvar resposta')
    }
  }

  const completeExecution = async () => {
    if (!execution) return

    // Check required items (is_not_applicable also counts as completed)
    const requiredItems = checklist.items.filter(item => item.is_required)
    const uncheckedRequired = requiredItems.filter(item => 
      !responses[item.id]?.is_checked && !responses[item.id]?.is_not_applicable
    )

    if (uncheckedRequired.length > 0) {
      toast.error(`${uncheckedRequired.length} item(s) obrigatório(s) não marcado(s)`)
      return
    }

    setIsSubmitting(true)

    try {
      await api.post(`/executions/${execution.id}/complete`)
      setCompletedExecutionId(execution.id)
      setIsCompleted(true)
      toast.success('Checklist finalizado com sucesso!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao finalizar')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Abrir modal de compartilhamento
  const openShareModal = async () => {
    if (!completedExecutionId) return

    setShowShareModal(true)
    setIsLoadingShare(true)

    try {
      const response = await api.get(`/executions/${completedExecutionId}/share`)
      setShareData(response.data)
    } catch (error) {
      toast.error('Erro ao carregar comprovante')
      setShowShareModal(false)
    } finally {
      setIsLoadingShare(false)
    }
  }

  // Download da imagem
  const handleDownload = () => {
    if (!shareData) return

    const link = document.createElement('a')
    link.href = shareData.image
    link.download = shareData.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Imagem baixada!')
  }

  // Enviar por email
  const handleSendEmail = async () => {
    if (!shareEmail || !completedExecutionId) return

    setIsSendingEmail(true)
    try {
      await api.post(`/executions/${completedExecutionId}/share/email`, { email: shareEmail })
      toast.success('Comprovante enviado por email!')
      setShareEmail('')
    } catch (error) {
      toast.error('Erro ao enviar email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Compartilhar via WhatsApp
  const handleShareWhatsApp = async () => {
    if (!shareData) return

    // Usar Web Share API se disponível
    if (navigator.share && navigator.canShare) {
      try {
        // Converter base64 para blob
        const response = await fetch(shareData.image)
        const blob = await response.blob()
        const file = new File([blob], shareData.filename, { type: 'image/png' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Checklist: ${shareData.execution.checklistTitle}`,
            text: `Checklist "${shareData.execution.checklistTitle}" concluído com ${shareData.execution.completionRate}% de conformidade.`
          })
          return
        }
      } catch (error) {
        console.log('Web Share API não suportada ou cancelada')
      }
    }

    // Fallback: abrir WhatsApp Web com texto
    const text = encodeURIComponent(
      `Checklist "${shareData.execution.checklistTitle}" concluído!\n` +
      `Empresa: ${shareData.execution.companyName}\n` +
      `Executado por: ${shareData.execution.executedBy}\n` +
      `Conformidade: ${shareData.execution.completionRate}%\n\n` +
      `Baixe a imagem do comprovante no CheckList App.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
    toast.success('Abrindo WhatsApp...')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Checklist não encontrado</h1>
          <p className="text-dark-400">Este checklist pode ter sido removido ou está inativo.</p>
        </div>
      </div>
    )
  }

  // Completed state
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md w-full"
        >
          {/* Badge de sucesso com botão de compartilhar */}
          <div className="relative inline-block">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-teal rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Botão de compartilhar */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              onClick={openShareModal}
              className="absolute -right-2 top-0 w-10 h-10 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
              title="Compartilhar"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">Checklist Concluído!</h1>
          <p className="text-dark-400 mb-2">
            O checklist "{checklist.title}" foi executado com sucesso.
          </p>
          <p className="text-dark-500 text-sm mb-8">
            Executado por: {user?.name}
          </p>
          
          <div className="flex flex-col gap-3">
            {/* Botão de compartilhar destacado */}
            <button
              onClick={openShareModal}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Compartilhar Comprovante
            </button>

            <button
              onClick={() => {
                setExecution(null)
                setIsCompleted(false)
                setCompletedExecutionId(null)
                fetchChecklist()
              }}
              className="w-full py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-xl transition-colors"
            >
              Executar Novamente
            </button>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl transition-colors"
              >
                Ir para Dashboard
              </button>
            )}
          </div>
        </motion.div>

        {/* Modal de Compartilhamento */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header do Modal */}
                <div className="flex items-center justify-between p-4 border-b border-dark-700">
                  <h2 className="text-lg font-semibold text-white">Compartilhar Comprovante</h2>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-dark-400" />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  {isLoadingShare ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                      <p className="text-dark-400">Gerando comprovante...</p>
                    </div>
                  ) : shareData ? (
                    <>
                      {/* Preview da imagem */}
                      <div className="mb-6">
                        <img
                          src={shareData.image}
                          alt="Comprovante do Checklist"
                          className="w-full rounded-xl border border-dark-700"
                        />
                      </div>

                      {/* Botões de ação */}
                      <div className="space-y-3">
                        {/* Download */}
                        <button
                          onClick={handleDownload}
                          className="w-full py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Baixar Imagem
                        </button>

                        {/* WhatsApp */}
                        <button
                          onClick={handleShareWhatsApp}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Enviar por WhatsApp
                        </button>

                        {/* Email */}
                        <div className="pt-3 border-t border-dark-700">
                          <label className="block text-sm text-dark-400 mb-2">
                            Enviar por E-mail
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={shareEmail}
                              onChange={(e) => setShareEmail(e.target.value)}
                              placeholder="email@exemplo.com"
                              className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                            />
                            <button
                              onClick={handleSendEmail}
                              disabled={!shareEmail || isSendingEmail}
                              className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isSendingEmail ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Mail className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                      <p className="text-dark-400">Erro ao carregar comprovante</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const checkedCount = Object.values(responses).filter(r => r.is_checked || r.is_not_applicable).length
  const progress = checklist.items.length > 0 
    ? Math.round((checkedCount / checklist.items.length) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-teal rounded-xl flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{checklist.title}</h1>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <Building2 className="w-3.5 h-3.5" />
                <span>{checklist.company_name}</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {execution && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Progresso</span>
                <span className="text-primary-400 font-medium">{checkedCount}/{checklist.items.length}</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-teal"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {!execution ? (
          // Start Screen
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-400 font-bold text-3xl">
              {checklist.title?.charAt(0).toUpperCase() || 'C'}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">{checklist.title}</h2>
            {checklist.description && (
              <p className="text-dark-400 mb-6">{checklist.description}</p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm text-dark-400 mb-8">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4" />
                {checklist.items.length} itens
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                ~{Math.ceil(checklist.items.length * 0.5)} min
              </span>
            </div>

            {/* Login Form or Start Button */}
            <AnimatePresence mode="wait">
              {showLoginForm && !isAuthenticated ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-sm mx-auto"
                >
                  <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <LogIn className="w-5 h-5 text-primary-400" />
                      <h3 className="text-lg font-semibold text-white">Fazer Login</h3>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                          <input
                            type="email"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            placeholder="Seu email"
                            className="w-full pl-12 pr-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            placeholder="Sua senha"
                            className="w-full pl-12 pr-12 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoggingIn ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Entrar
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>

                    <button
                      onClick={() => setShowLoginForm(false)}
                      className="w-full mt-4 text-sm text-dark-400 hover:text-white"
                    >
                      Voltar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="start-button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 max-w-sm mx-auto">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-white">{user?.name}</p>
                            <p className="text-sm text-dark-400">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={startExecution}
                        className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all btn-glow"
                      >
                        Iniciar Execução
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-dark-400">Faça login para executar este checklist</p>
                      <button
                        onClick={() => setShowLoginForm(true)}
                        className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all btn-glow"
                      >
                        <LogIn className="w-5 h-5" />
                        Fazer Login
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // Execution
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-dark-800/50 border border-dark-700 rounded-xl mb-4">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-dark-400">Executando checklist</p>
              </div>
            </div>

            {/* Items */}
            {checklist.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl transition-all ${
                  responses[item.id]?.is_checked
                    ? 'bg-primary-500/10 border border-primary-500/30'
                    : responses[item.id]?.is_not_applicable
                    ? 'bg-dark-700/50 border border-dark-600'
                    : 'bg-dark-800/50 border border-dark-700/50'
                }`}
              >
                <div 
                  onClick={() => toggleItem(item.id)}
                  className="flex items-start gap-4 cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    responses[item.id]?.is_checked
                      ? 'bg-primary-500 text-white'
                      : responses[item.id]?.is_not_applicable
                      ? 'bg-dark-600 text-dark-400'
                      : 'border-2 border-dark-500'
                  }`}>
                    {responses[item.id]?.is_checked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>
                    )}
                    {responses[item.id]?.is_not_applicable && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`font-medium transition-colors ${
                        responses[item.id]?.is_checked 
                          ? 'text-primary-400' 
                          : responses[item.id]?.is_not_applicable
                          ? 'text-dark-500 line-through'
                          : 'text-white'
                      }`}>
                        {item.title}
                      </span>
                      {item.is_required && !responses[item.id]?.is_not_applicable && (
                        <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          Obrigatorio
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className={`text-sm mt-1 ${
                        responses[item.id]?.is_not_applicable ? 'text-dark-600' : 'text-dark-400'
                      }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Not Applicable Button */}
                <div className="mt-3 pt-3 border-t border-dark-700/50 flex justify-end">
                  <button
                    onClick={(e) => toggleNotApplicable(item.id, e)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      responses[item.id]?.is_not_applicable
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-dark-700/50 text-dark-400 hover:bg-dark-700 hover:text-dark-300'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {responses[item.id]?.is_not_applicable ? 'Marcado como N/A' : 'Nao necessario'}
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Complete Button */}
            <div className="pt-6">
              <button
                onClick={completeExecution}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Finalizar Checklist
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
