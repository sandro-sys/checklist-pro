import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Headphones, 
  Send, 
  MessageSquare,
  RefreshCw,
  User,
  Crown,
  Plus
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Support() {
  const { user } = useAuthStore()
  const messagesEndRef = useRef(null)
  
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchMessages()
    fetchUnreadCount()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/support')
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/support/unread')
      setUnreadCount(response.data.unread_count)
    } catch (error) {
      console.error('Erro ao contar mensagens:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Digite uma mensagem')
      return
    }
    
    if (showNewMessage && !newSubject.trim()) {
      toast.error('Digite um assunto')
      return
    }
    
    try {
      setSending(true)
      await api.post('/support', {
        subject: showNewMessage ? newSubject : 'Resposta',
        message: newMessage
      })
      
      setNewMessage('')
      setNewSubject('')
      setShowNewMessage(false)
      fetchMessages()
      toast.success('Mensagem enviada!')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-xl">
              <Headphones className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Suporte</h1>
              <p className="text-dark-400">Tire dúvidas e envie sugestões</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowNewMessage(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Mensagem
          </button>
        </div>
      </div>

      {/* Nova Mensagem Form */}
      {showNewMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Nova Mensagem</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Assunto</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Ex: Dúvida sobre funcionalidade, Sugestão de melhoria..."
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Mensagem</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Descreva sua dúvida ou sugestão..."
                rows={4}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewMessage(false)
                  setNewSubject('')
                  setNewMessage('')
                }}
                className="px-4 py-2 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={sendMessage}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Enviar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mensagens */}
      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma mensagem ainda</h3>
            <p className="text-dark-400 mb-6">Inicie uma conversa com o suporte</p>
            <button
              onClick={() => setShowNewMessage(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Enviar Primeira Mensagem
            </button>
          </div>
        ) : (
          <>
            {/* Lista de Mensagens */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {messages.map((msg, index) => {
                const isFromMaster = msg.is_from_master === 1
                const showSubject = index === 0 || messages[index - 1]?.subject !== msg.subject
                
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isFromMaster ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] ${isFromMaster ? 'order-2' : 'order-1'}`}>
                      {showSubject && msg.subject && (
                        <p className={`text-xs font-medium mb-1 ${isFromMaster ? 'text-amber-400' : 'text-primary-400'}`}>
                          {msg.subject}
                        </p>
                      )}
                      <div className={`p-4 rounded-2xl ${
                        isFromMaster
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : 'bg-primary-500/10 border border-primary-500/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {isFromMaster ? (
                            <Crown className="w-4 h-4 text-amber-400" />
                          ) : (
                            <User className="w-4 h-4 text-primary-400" />
                          )}
                          <span className={`text-sm font-medium ${isFromMaster ? 'text-amber-400' : 'text-primary-400'}`}>
                            {isFromMaster ? 'Suporte CheckList App' : msg.user_name}
                          </span>
                          <span className="text-xs text-dark-500">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Resposta Rápida */}
            <div className="p-4 border-t border-dark-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite uma resposta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !showNewMessage && sendMessage()}
                  className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500"
                />
                <button
                  onClick={() => {
                    if (!showNewMessage) sendMessage()
                  }}
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {sending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

