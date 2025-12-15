import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Digite seu email')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setIsSubmitted(true)
      toast.success('Verifique seu email!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao processar solicitação')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Email Enviado!</h2>
        <p className="text-dark-400 mb-6">
          Se o email <span className="text-primary-400">{email}</span> estiver cadastrado, 
          você receberá um link para redefinir sua senha.
        </p>
        
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 mb-6">
          <p className="text-dark-300 text-sm">
            <strong className="text-white">Dica:</strong> Verifique também sua pasta de spam ou lixo eletrônico.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setIsSubmitted(false)
              setEmail('')
            }}
            className="w-full py-3 bg-dark-700 text-white font-medium rounded-xl hover:bg-dark-600 transition-colors"
          >
            Tentar outro email
          </button>
          
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
        <h2 className="text-3xl font-bold text-white mb-2">Esqueceu a senha?</h2>
        <p className="text-dark-400">
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-12 pr-4 py-3.5 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Enviar link de recuperação'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-dark-400">
        Lembrou a senha?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Fazer login
        </Link>
      </p>
    </motion.div>
  )
}

