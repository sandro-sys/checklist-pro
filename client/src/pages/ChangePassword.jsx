import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowRight, Loader2, Check, X, ShieldAlert } from 'lucide-react'
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

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { changePassword, user } = useAuthStore()

  const passwordValidation = useMemo(() => validatePassword(formData.newPassword), [formData.newPassword])
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.currentPassword || !formData.newPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (!isPasswordValid) {
      toast.error('A nova senha não atende aos requisitos de segurança')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setIsLoading(true)
    const result = await changePassword(formData.currentPassword, formData.newPassword)
    setIsLoading(false)

    if (result.success) {
      toast.success('Senha alterada com sucesso!')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-dark-900/50 backdrop-blur-xl border border-dark-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Troca de Senha Obrigatória</h2>
            <p className="text-dark-400 text-sm">
              Por motivos de segurança, você precisa criar uma nova senha forte antes de continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Digite sua senha atual"
                  className="w-full pl-12 pr-12 py-3.5 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Crie uma senha forte"
                  className={`w-full pl-12 pr-12 py-3.5 bg-dark-800/50 border rounded-xl text-white placeholder-dark-500 focus:ring-1 transition-all ${
                    formData.newPassword 
                      ? isPasswordValid 
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                        : 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500'
                      : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {formData.newPassword && (
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
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita a nova senha"
                  className={`w-full pl-12 pr-4 py-3.5 bg-dark-800/50 border rounded-xl text-white placeholder-dark-500 focus:ring-1 transition-all ${
                    formData.confirmPassword 
                      ? formData.confirmPassword === formData.newPassword
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
              </div>
              {formData.confirmPassword && formData.confirmPassword !== formData.newPassword && (
                <p className="mt-1 text-xs text-red-400">As senhas não coincidem</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Alterar Senha
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

