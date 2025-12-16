import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Users,
  Building2,
  PlayCircle,
  BarChart3,
  Target,
  Activity,
  Zap,
  Award,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, company, setCompany } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [checklists, setChecklists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('7')

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      // Fetch company
      const companyRes = await api.get('/companies/my-company')
      setCompany(companyRes.data)

      // Fetch stats
      const statsRes = await api.get(`/executions/stats/${companyRes.data.id}?period=${period}`)
      setStats(statsRes.data)

      // Fetch recent checklists
      const checklistsRes = await api.get(`/checklists/company/${companyRes.data.id}?is_active=true`)
      setChecklists(checklistsRes.data.slice(0, 5))
    } catch (error) {
      if (error.response?.status === 404) {
        // User doesn't have a company yet
        setCompany(null)
      } else {
        toast.error('Erro ao carregar dados')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  // No company - show setup
  if (!company) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center py-12"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-accent-teal/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Bem-vindo ao CheckList App!</h1>
        <p className="text-dark-400 text-lg mb-8">
          Para comecar, voce precisa cadastrar sua empresa. 
          Isso permitira criar checklists e gerenciar sua equipe.
        </p>
        <Link
          to="/company"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all btn-glow"
        >
          Cadastrar Empresa
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    )
  }

  // Cards principais
  const mainStats = [
    {
      title: 'Execucoes Hoje',
      value: stats?.today_executions || 0,
      icon: Zap,
      color: 'from-accent-amber to-orange-500',
      bgColor: 'bg-accent-amber/10',
      textColor: 'text-accent-amber'
    },
    {
      title: `Execucoes (${period} dias)`,
      value: stats?.total_executions || 0,
      icon: CheckCircle2,
      color: 'from-primary-500 to-accent-teal',
      bgColor: 'bg-primary-500/10',
      textColor: 'text-primary-400'
    },
    {
      title: 'Taxa de Conclusao',
      value: `${stats?.completion_rate || 0}%`,
      icon: Target,
      color: 'from-accent-teal to-cyan-400',
      bgColor: 'bg-accent-teal/10',
      textColor: 'text-accent-teal'
    },
    {
      title: 'Em Andamento',
      value: stats?.in_progress_executions || 0,
      icon: PlayCircle,
      color: 'from-accent-violet to-purple-400',
      bgColor: 'bg-accent-violet/10',
      textColor: 'text-accent-violet'
    }
  ]

  // Cards secundarios
  const secondaryStats = [
    {
      title: 'Total Checklists',
      value: company.total_checklists || 0,
      icon: ClipboardList,
      textColor: 'text-primary-400'
    },
    {
      title: 'Colaboradores',
      value: company.total_users || 1,
      icon: Users,
      textColor: 'text-accent-teal'
    },
    {
      title: 'Media/Dia',
      value: stats?.avg_executions_per_day || 0,
      icon: Activity,
      textColor: 'text-accent-amber'
    },
    {
      title: 'Itens Respondidos',
      value: stats?.total_items_responded || 0,
      icon: CheckCircle2,
      textColor: 'text-green-400'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Ola, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-dark-400 mt-1">{company.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="7">Ultimos 7 dias</option>
            <option value="15">Ultimos 15 dias</option>
            <option value="30">Ultimos 30 dias</option>
            <option value="90">Ultimos 90 dias</option>
          </select>
          <Link
            to="/checklists/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all btn-glow"
          >
            <Plus className="w-5 h-5" />
            Novo Checklist
          </Link>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-5 card-hover"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            <p className="text-dark-400 text-sm mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {secondaryStats.map((stat, index) => (
          <div
            key={stat.title}
            className="bg-dark-800/30 border border-dark-700/30 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-dark-700/50 rounded-lg flex items-center justify-center">
              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
            </div>
            <div>
              <p className="text-dark-500 text-xs">{stat.title}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Checklists */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Checklists Recentes</h2>
            <Link to="/checklists" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {checklists.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Nenhum checklist criado ainda</p>
              <Link to="/checklists/create" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                Criar primeiro checklist
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {checklists.map((checklist, index) => (
                <motion.div
                  key={checklist.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <Link
                    to={`/checklists/${checklist.id}/edit`}
                    className="flex items-center gap-4 p-4 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-all group"
                  >
                    <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 font-bold">
                      {checklist.title?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                        {checklist.title}
                      </h3>
                      <p className="text-sm text-dark-400">
                        {checklist.items_count} itens • {checklist.executions_count} execucoes
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Top Users */}
          {stats?.top_users?.length > 0 && (
            <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-accent-amber" />
                <h3 className="font-semibold text-white">Top Colaboradores</h3>
              </div>
              <div className="space-y-3">
                {stats.top_users.slice(0, 5).map((userItem, index) => (
                  <div key={userItem.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-accent-amber/20 text-accent-amber' :
                      index === 1 ? 'bg-dark-500/30 text-dark-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-dark-700 text-dark-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{userItem.name}</p>
                    </div>
                    <span className="text-sm font-medium text-primary-400">
                      {userItem.execution_count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Checklists */}
          {stats?.top_checklists?.length > 0 && (
            <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white">Mais Executados</h3>
              </div>
              <div className="space-y-3">
                {stats.top_checklists.filter(c => c.execution_count > 0).slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-dark-300 truncate flex-1 mr-2">{item.title}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-teal rounded-full"
                          style={{ 
                            width: `${Math.min(100, (item.execution_count / (stats.top_checklists[0]?.execution_count || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-primary-400 w-8 text-right">
                        {item.execution_count}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.top_checklists.filter(c => c.execution_count > 0).length === 0 && (
                  <p className="text-sm text-dark-500 text-center py-2">Nenhuma execucao ainda</p>
                )}
              </div>
            </div>
          )}

          {/* Categories */}
          {stats?.executions_by_category?.length > 0 && (
            <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-accent-teal" />
                <h3 className="font-semibold text-white">Por Categoria</h3>
              </div>
              <div className="space-y-2">
                {stats.executions_by_category.slice(0, 5).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-dark-300">{cat.name}</span>
                    <span className="text-sm font-medium text-accent-teal">
                      {cat.execution_count} exec.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Acoes Rapidas</h3>
            <div className="space-y-2">
              <Link
                to="/checklists/create"
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-500/10 to-accent-teal/10 border border-primary-500/20 rounded-xl hover:border-primary-500/40 transition-all group"
              >
                <Plus className="w-5 h-5 text-primary-400" />
                <span className="text-sm font-medium text-white group-hover:text-primary-400">Criar Checklist</span>
              </Link>
              <Link
                to="/company?tab=categories"
                className="flex items-center gap-3 p-3 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-all group"
              >
                <ClipboardList className="w-5 h-5 text-dark-400" />
                <span className="text-sm font-medium text-dark-300 group-hover:text-white">Categorias</span>
              </Link>
              <Link
                to="/team"
                className="flex items-center gap-3 p-3 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-all group"
              >
                <Users className="w-5 h-5 text-dark-400" />
                <span className="text-sm font-medium text-dark-300 group-hover:text-white">Gerenciar Equipe</span>
              </Link>
              <Link
                to="/company"
                className="flex items-center gap-3 p-3 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-all group"
              >
                <Building2 className="w-5 h-5 text-dark-400" />
                <span className="text-sm font-medium text-dark-300 group-hover:text-white">Configuracoes</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
