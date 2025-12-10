import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Filter,
  Download
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ExecutionHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [checklist, setChecklist] = useState(null)
  const [executions, setExecutions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [checklistRes, executionsRes] = await Promise.all([
        api.get(`/checklists/${id}`),
        api.get(`/executions/checklist/${id}`)
      ])
      setChecklist(checklistRes.data)
      setExecutions(executionsRes.data)
    } catch (error) {
      toast.error('Erro ao carregar histórico')
      navigate('/checklists')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredExecutions = executions.filter(exec => {
    if (filter === 'all') return true
    return exec.status === filter
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Histórico de Execuções</h1>
          <p className="text-dark-400 mt-1">{checklist?.title}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{executions.length}</p>
          <p className="text-sm text-dark-400">Total</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary-400">
            {executions.filter(e => e.status === 'completed').length}
          </p>
          <p className="text-sm text-dark-400">Concluídos</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent-amber">
            {executions.filter(e => e.status === 'in_progress').length}
          </p>
          <p className="text-sm text-dark-400">Em Andamento</p>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-6"
      >
        <Filter className="w-5 h-5 text-dark-400" />
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'completed', label: 'Concluídos' },
            { value: 'in_progress', label: 'Em Andamento' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Executions List */}
      {filteredExecutions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Nenhuma execução encontrada</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredExecutions.map((execution, index) => (
            <motion.div
              key={execution.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    execution.status === 'completed'
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'bg-accent-amber/20 text-accent-amber'
                  }`}>
                    {execution.status === 'completed' 
                      ? <CheckCircle2 className="w-5 h-5" />
                      : <Clock className="w-5 h-5" />
                    }
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-dark-500" />
                      <span className="font-medium text-white">
                        {execution.executed_by_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-dark-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(execution.executed_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(execution.executed_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    execution.status === 'completed'
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'bg-accent-amber/10 text-accent-amber'
                  }`}>
                    {execution.status === 'completed' ? 'Concluído' : 'Em Andamento'}
                  </span>
                  
                  <p className="text-sm text-dark-400 mt-2">
                    {execution.checked_count}/{execution.total_items} itens
                  </p>
                </div>
              </div>

              {execution.notes && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <p className="text-sm text-dark-400">
                    <span className="text-dark-500">Observações:</span> {execution.notes}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

