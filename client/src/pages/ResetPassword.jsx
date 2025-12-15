import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, XCircle, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [userName, setUserName] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // Requisitos de senha
  const passwordRequirements = [
    { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
    { label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
    { label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
    { label: 'Um número', test: (p) => /[0-9]/.test(p) },
    { label: 'Um caractere especial', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ]

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false)
        setIsValid(false)
        return
      }

      try {
        const response = await api.get(`/auth/verify-reset-token?token=${token}`)
        if (response.data.valid) {
          setIsValid(true)
          setUserName(response.data.name)
        } else {
          setIsValid(false)
        }
      } catch (error) {
        setIsValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    const allRequirementsMet = passwordRequirements.every(req => req.test(password))
    if (!allRequirementsMet) {
      toast.error('A senha não atende todos os requisitos')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword: password })
      setIsSuccess(true)
      toast.success('Senha alterada com sucesso!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao redefinir senha')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isVerifying) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-dark-400">Verificando link...</p>
      </motion.div>
    )
  }

  // Invalid token
  if (!isValid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Link Inválido ou Expirado</h2>
        <p className="text-dark-400 mb-6">
          Este link de recuperação de senha não é válido ou já expirou.
          Solicite um novo link para redefinir sua senha.
        </p>

        <div className="space-y-3">
          <Link
            to="/forgot-password"
            className="block w-full py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
          >
            Solicitar novo link
          </Link>
          
          <Link
            to="/login"
            className="block w-full py-3 text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Voltar ao login
          </Link>
        </div>
      </motion.div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Senha Alterada!</h2>
        <p className="text-dark-400 mb-6">
          Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
        </p>

        <Link
          to="/login"
          className="block w-full py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
        >
          Ir para o login
        </Link>
      </motion.div>
    )
  }

  // Reset password form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link 
        to="/login" 
        className="inline-flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao login
      </Link>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Nova Senha</h2>
        <p className="text-dark-400">
          Olá <span className="text-primary-400">{userName}</span>, crie sua nova senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-3.5 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
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

        {/* Password Requirements */}
        {password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-dark-800/50 border border-dark-700 rounded-xl p-4"
          >
            <p className="text-sm font-medium text-dark-300 mb-3">Requisitos da senha:</p>
            <div className="grid grid-cols-1 gap-2">
              {passwordRequirements.map((req, index) => {
                const isMet = req.test(password)
                return (
                  <div key={index} className="flex items-center gap-2">
                    {isMet ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-dark-500" />
                    )}
                    <span className={`text-sm ${isMet ? 'text-green-500' : 'text-dark-500'}`}>
                      {req.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-3.5 bg-dark-800/50 border rounded-xl text-white placeholder-dark-500 focus:ring-1 transition-all ${
                confirmPassword && password !== confirmPassword
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : confirmPassword && password === confirmPassword
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-2 text-sm text-red-500">As senhas não coincidem</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Redefinir Senha'
          )}
        </button>
      </form>
    </motion.div>
  )
}

