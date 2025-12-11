import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

// Validacao de senha forte
function validatePassword(password) {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
}

function PasswordRequirement({ met, text }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-400' : 'text-dark-500'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  )
}

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    lgpd_consent: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuthStore()

  const passwordValidation = useMemo(() => validatePassword(formData.password), [formData.password])
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!isPasswordValid) {
      toast.error('A senha não atende aos requisitos de segurança')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (!formData.lgpd_consent) {
      toast.error('Você precisa aceitar os termos de uso e política de privacidade')
      return
    }

    setIsLoading(true)
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      lgpd_consent: formData.lgpd_consent
    })
    setIsLoading(false)

    if (result.success) {
      toast.success('Conta criada com sucesso!')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Criar conta</h2>
        <p className="text-dark-400">Comece a gerenciar seus processos hoje</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome"
              className="w-full pl-12 pr-4 py-3.5 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className="w-full pl-12 pr-4 py-3.5 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Senha forte"
              className={`w-full pl-12 pr-12 py-3.5 bg-dark-800/50 border rounded-xl text-white placeholder-dark-500 focus:ring-1 transition-all ${
                formData.password 
                  ? isPasswordValid 
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                    : 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500'
                  : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password Requirements */}
          {formData.password && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-dark-800/50 rounded-lg border border-dark-700"
            >
              <p className="text-xs text-dark-400 mb-2">Requisitos da senha:</p>
              <div className="grid grid-cols-2 gap-1">
                <PasswordRequirement met={passwordValidation.minLength} text="8+ caracteres" />
                <PasswordRequirement met={passwordValidation.hasLowercase} text="Letra minúscula" />
                <PasswordRequirement met={passwordValidation.hasUppercase} text="Letra maiúscula" />
                <PasswordRequirement met={passwordValidation.hasNumber} text="Número" />
                <PasswordRequirement met={passwordValidation.hasSpecial} text="Caractere especial" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Confirmar senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repita a senha"
              className="w-full pl-12 pr-4 py-3.5 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        {/* LGPD Consent */}
        <div className="flex items-start gap-3 pt-2">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              name="lgpd_consent"
              checked={formData.lgpd_consent}
              onChange={handleChange}
              className="checkbox-custom"
            />
          </div>
          <label className="text-sm text-dark-400 leading-relaxed">
            Li e aceito os{' '}
            <Link to="/terms" target="_blank" className="text-primary-400 hover:text-primary-300">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link to="/privacy" target="_blank" className="text-primary-400 hover:text-primary-300">
              Política de Privacidade
            </Link>
            , incluindo o tratamento dos meus dados pessoais conforme a LGPD.
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-glow mt-6"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Criar conta
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-8 text-center text-dark-400">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Entrar
        </Link>
      </p>
    </motion.div>
  )
}

