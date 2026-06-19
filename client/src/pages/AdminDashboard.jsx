import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Users, 
  ClipboardCheck, 
  Activity,
  TrendingUp,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  UserX,
  UserCheck,
  Crown,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Copy,
  Send,
  Headphones,
  Target,
  ArrowRight,
  Lock,
  Unlock
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  
  // Companies state
  const [companies, setCompanies] = useState([])
  const [companiesPage, setCompaniesPage] = useState(1)
  const [companiesTotalPages, setCompaniesTotalPages] = useState(1)
  const [companiesSearch, setCompaniesSearch] = useState('')
  const [companiesPlanFilter, setCompaniesPlanFilter] = useState('')
  
  // Users state
  const [users, setUsers] = useState([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  
  // Messages state
  const [messages, setMessages] = useState([])
  const [messagesPage, setMessagesPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  
  // Selected company detail
  const [selectedCompany, setSelectedCompany] = useState(null)
  
  // Company metrics
  const [companyMetrics, setCompanyMetrics] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  
  // Copy checklists state
  const [allChecklists, setAllChecklists] = useState([])
  const [checklistSearch, setChecklistSearch] = useState('')
  const [selectedChecklist, setSelectedChecklist] = useState(null)
  const [sourceCompanyId, setSourceCompanyId] = useState('')
  const [sourceCompanyChecklists, setSourceCompanyChecklists] = useState([])
  const [targetCompanyId, setTargetCompanyId] = useState('')
  const [copying, setCopying] = useState(false)
  
  // Support messages state
  const [supportConversations, setSupportConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [conversationMessages, setConversationMessages] = useState([])
  const [newSupportMessage, setNewSupportMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [unreadSupport, setUnreadSupport] = useState(0)

  useEffect(() => {
    if (!user?.is_master) {
      navigate('/dashboard')
      return
    }
    fetchDashboard()
  }, [user, navigate])

  useEffect(() => {
    if (activeTab === 'companies') {
      fetchCompanies()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'messages') {
      fetchMessages()
    } else if (activeTab === 'copy') {
      fetchAllChecklists()
      fetchCompanies()
    } else if (activeTab === 'support') {
      fetchSupportConversations()
    }
  }, [activeTab, companiesPage, companiesSearch, companiesPlanFilter, usersPage, usersSearch, messagesPage, unreadOnly, checklistSearch])

  const fetchDashboard = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/admin/dashboard')
      setDashboard(response.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/admin/companies', {
        params: {
          page: companiesPage,
          search: companiesSearch,
          plan: companiesPlanFilter
        }
      })
      setCompanies(response.data.companies)
      setCompaniesTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: usersPage,
          search: usersSearch
        }
      })
      setUsers(response.data.users)
      setUsersTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await api.get('/admin/messages', {
        params: {
          page: messagesPage,
          unread_only: unreadOnly
        }
      })
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const fetchCompanyDetails = async (companyId) => {
    try {
      const response = await api.get(`/admin/companies/${companyId}`)
      setSelectedCompany(response.data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      toast.error('Erro ao carregar detalhes da empresa')
    }
  }

  const fetchCompanyMetrics = async (companyId) => {
    try {
      setLoadingMetrics(true)
      const response = await api.get(`/admin/companies/${companyId}/metrics`)
      setCompanyMetrics(response.data)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      toast.error('Erro ao carregar métricas')
    } finally {
      setLoadingMetrics(false)
    }
  }

  const fetchAllChecklists = async () => {
    try {
      const response = await api.get('/admin/checklists', {
        params: { search: checklistSearch }
      })
      setAllChecklists(response.data.checklists)
    } catch (error) {
      console.error('Erro ao carregar checklists:', error)
    }
  }

  // Buscar checklists de uma empresa específica (origem)
  const fetchSourceCompanyChecklists = async (companyId) => {
    if (!companyId) {
      setSourceCompanyChecklists([])
      return
    }
    try {
      const response = await api.get('/admin/checklists', {
        params: { company_id: companyId }
      })
      setSourceCompanyChecklists(response.data.checklists || [])
    } catch (error) {
      console.error('Erro ao carregar checklists da empresa:', error)
      setSourceCompanyChecklists([])
    }
  }

  // Quando selecionar empresa de origem, buscar seus checklists
  const handleSelectSourceCompany = (companyId) => {
    setSourceCompanyId(companyId)
    setSelectedChecklist(null) // Limpar checklist selecionado
    fetchSourceCompanyChecklists(companyId)
  }

  const copyChecklist = async () => {
    if (!selectedChecklist || !targetCompanyId) {
      toast.error('Selecione um checklist e uma empresa de destino')
      return
    }
    
    if (sourceCompanyId === targetCompanyId) {
      toast.error('A empresa de origem e destino não podem ser a mesma')
      return
    }
    
    try {
      setCopying(true)
      const response = await api.post(`/admin/checklists/${selectedChecklist}/copy`, {
        target_company_id: targetCompanyId
      })
      toast.success(response.data.message || 'Checklist copiado com sucesso!')
      setSelectedChecklist(null)
      // Não limpar sourceCompanyId e targetCompanyId para facilitar múltiplas cópias
    } catch (error) {
      console.error('Erro ao copiar checklist:', error)
      toast.error(error.response?.data?.details || 'Erro ao copiar checklist')
    } finally {
      setCopying(false)
    }
  }

  const fetchSupportConversations = async () => {
    try {
      const response = await api.get('/admin/support')
      setSupportConversations(response.data.conversations)
      setUnreadSupport(response.data.unread_total)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    }
  }

  const fetchConversationMessages = async (companyId) => {
    try {
      const response = await api.get(`/admin/support/${companyId}`)
      setConversationMessages(response.data.messages)
      setSelectedConversation(response.data.company)
      fetchSupportConversations() // Atualizar contadores
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      toast.error('Erro ao carregar mensagens')
    }
  }

  const sendSupportMessage = async () => {
    if (!newSupportMessage.trim() || !selectedConversation) return
    
    try {
      setSendingMessage(true)
      await api.post(`/admin/support/${selectedConversation.id}`, {
        message: newSupportMessage
      })
      setNewSupportMessage('')
      fetchConversationMessages(selectedConversation.id)
      toast.success('Mensagem enviada!')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSendingMessage(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: !currentStatus })
      toast.success(currentStatus ? 'Usuário desativado' : 'Usuário ativado')
      fetchUsers()
    } catch (error) {
      toast.error('Erro ao alterar status')
    }
  }

  const toggleUserMaster = async (userId, currentMaster) => {
    try {
      await api.put(`/admin/users/${userId}/master`, { is_master: !currentMaster })
      toast.success(currentMaster ? 'Privilégios master removidos' : 'Usuário promovido a master')
      fetchUsers()
    } catch (error) {
      toast.error('Erro ao alterar privilégios')
    }
  }

  const markMessageAsRead = async (messageId) => {
    try {
      await api.put(`/admin/messages/${messageId}/read`)
      fetchMessages()
      fetchDashboard()
    } catch (error) {
      toast.error('Erro ao marcar como lida')
    }
  }

  const handleToggleBlock = async (company) => {
    const next = !company.is_blocked
    const msg = next
      ? `Bloquear "${company.name}"? O acesso será negado para todos os usuários.`
      : `Desbloquear "${company.name}"?`
    if (!confirm(msg)) return
    try {
      const { data } = await api.put(`/admin/companies/${company.id}/block`, { is_blocked: next })
      toast.success(data.message)
      fetchCompanies()
    } catch {
      toast.error('Erro ao alterar bloqueio')
    }
  }

  const updateCompanyPlan = async (companyId, plan) => {
    try {
      const expiresAt = plan === 'trial' 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : plan === 'free' 
        ? null
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      
      await api.put(`/admin/companies/${companyId}/plan`, { plan, plan_expires_at: expiresAt })
      toast.success('Plano atualizado com sucesso')
      fetchCompanies()
      if (selectedCompany?.company?.id === companyId) {
        fetchCompanyDetails(companyId)
      }
    } catch (error) {
      toast.error('Erro ao atualizar plano')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPlanBadge = (plan) => {
    const badges = {
      trial: 'bg-amber-500/20 text-amber-400',
      free: 'bg-gray-500/20 text-gray-400',
      basic: 'bg-blue-500/20 text-blue-400',
      professional: 'bg-purple-500/20 text-purple-400',
      enterprise: 'bg-emerald-500/20 text-emerald-400'
    }
    return badges[plan] || badges.free
  }

  if (!user?.is_master) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Painel Master</h1>
          </div>
          <p className="text-dark-400">Gerencie toda a plataforma CheckList App</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'companies', label: 'Empresas', icon: Building2 },
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'copy', label: 'Copiar Checklists', icon: Copy },
            { id: 'support', label: 'Suporte', icon: Headphones },
            { id: 'messages', label: 'Contato', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'messages' && dashboard?.unread_messages > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                  {dashboard.unread_messages}
                </span>
              )}
              {tab.id === 'support' && unreadSupport > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                  {unreadSupport}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
              </div>
            ) : dashboard && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    icon={Building2}
                    label="Empresas"
                    value={dashboard.total_companies}
                    color="blue"
                  />
                  <StatCard
                    icon={Users}
                    label="Usuários"
                    value={dashboard.total_users}
                    color="green"
                  />
                  <StatCard
                    icon={ClipboardCheck}
                    label="Checklists"
                    value={dashboard.total_checklists}
                    color="purple"
                  />
                  <StatCard
                    icon={Activity}
                    label="Execuções"
                    value={dashboard.total_executions}
                    color="amber"
                  />
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    icon={TrendingUp}
                    label="Novas Empresas (30d)"
                    value={dashboard.new_companies_30d}
                    color="emerald"
                    small
                  />
                  <StatCard
                    icon={Users}
                    label="Usuários Ativos (7d)"
                    value={dashboard.active_users_7d}
                    color="cyan"
                    small
                  />
                  <StatCard
                    icon={Activity}
                    label="Execuções (7d)"
                    value={dashboard.executions_7d}
                    color="rose"
                    small
                  />
                  <StatCard
                    icon={Mail}
                    label="Mensagens não lidas"
                    value={dashboard.unread_messages}
                    color="orange"
                    small
                  />
                </div>

                {/* Companies by Plan */}
                <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary-400" />
                    Empresas por Plano
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {dashboard.companies_by_plan?.map(item => (
                      <div key={item.plan} className="bg-dark-700/50 rounded-xl p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getPlanBadge(item.plan)}`}>
                          {item.plan || 'Sem plano'}
                        </span>
                        <p className="text-2xl font-bold text-white">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {selectedCompany ? (
              <CompanyDetail
                data={selectedCompany}
                onBack={() => setSelectedCompany(null)}
                onUpdatePlan={updateCompanyPlan}
                formatDate={formatDate}
                getPlanBadge={getPlanBadge}
              />
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                      <input
                        type="text"
                        placeholder="Buscar empresa..."
                        value={companiesSearch}
                        onChange={(e) => {
                          setCompaniesSearch(e.target.value)
                          setCompaniesPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <select
                    value={companiesPlanFilter}
                    onChange={(e) => {
                      setCompaniesPlanFilter(e.target.value)
                      setCompaniesPage(1)
                    }}
                    className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white focus:border-primary-500"
                  >
                    <option value="">Todos os planos</option>
                    <option value="trial">Trial</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                {/* Companies List */}
                <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Empresa</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Proprietário</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Plano</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Usuários</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Checklists</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Execuções</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Criada em</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700/50">
                        {companies.map(company => (
                          <tr key={company.id} className="hover:bg-dark-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-white">{company.name}</p>
                                <p className="text-sm text-dark-400">{company.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-white">{company.owner_name}</p>
                                <p className="text-sm text-dark-400">{company.owner_email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadge(company.plan)}`}>
                                  {company.plan || 'free'}
                                </span>
                                {company.is_blocked ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Bloqueado
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-white">{company.users_count}</td>
                            <td className="px-4 py-3 text-center text-white">{company.checklists_count}</td>
                            <td className="px-4 py-3 text-center text-white">{company.executions_count}</td>
                            <td className="px-4 py-3 text-center text-dark-400 text-sm">
                              {formatDate(company.created_at)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleToggleBlock(company)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    company.is_blocked
                                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                  }`}
                                  title={company.is_blocked ? 'Desbloquear acesso' : 'Bloquear acesso'}
                                >
                                  {company.is_blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => fetchCompanyDetails(company.id)}
                                  className="p-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                                  title="Ver detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center px-4 py-3 border-t border-dark-700/50">
                    <button
                      onClick={() => setCompaniesPage(p => Math.max(1, p - 1))}
                      disabled={companiesPage === 1}
                      className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-dark-400">
                      Página {companiesPage} de {companiesTotalPages}
                    </span>
                    <button
                      onClick={() => setCompaniesPage(p => Math.min(companiesTotalPages, p + 1))}
                      disabled={companiesPage === companiesTotalPages}
                      className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value)
                    setUsersPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Usuário</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Empresa</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Tipo</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Último Login</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-dark-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                              <span className="text-primary-400 font-medium">
                                {u.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{u.name}</p>
                                {u.is_master === 1 && (
                                  <Crown className="w-4 h-4 text-amber-400" title="Master" />
                                )}
                              </div>
                              <p className="text-sm text-dark-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white">
                          {u.company_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-dark-700 text-dark-300 rounded text-sm">
                            {u.role_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm">
                              <CheckCircle className="w-3 h-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-sm">
                              <XCircle className="w-3 h-3" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-dark-400 text-sm">
                          {formatDate(u.last_login)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => toggleUserStatus(u.id, u.is_active)}
                              className={`p-2 rounded-lg transition-colors ${
                                u.is_active
                                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                              title={u.is_active ? 'Desativar' : 'Ativar'}
                            >
                              {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => toggleUserMaster(u.id, u.is_master === 1)}
                              className={`p-2 rounded-lg transition-colors ${
                                u.is_master === 1
                                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                  : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-white'
                              }`}
                              title={u.is_master === 1 ? 'Remover Master' : 'Tornar Master'}
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center px-4 py-3 border-t border-dark-700/50">
                <button
                  onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                  disabled={usersPage === 1}
                  className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-dark-400">
                  Página {usersPage} de {usersTotalPages}
                </span>
                <button
                  onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                  disabled={usersPage === usersTotalPages}
                  className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 transition-colors"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Filter */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-dark-300">Mostrar apenas não lidas</span>
              </label>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-8 text-center">
                  <Mail className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`bg-dark-800/50 border rounded-2xl p-6 transition-colors ${
                      message.read_at
                        ? 'border-dark-700/50'
                        : 'border-primary-500/50 bg-primary-500/5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{message.subject}</h3>
                          {!message.read_at && (
                            <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                              Nova
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-dark-400">
                          De: {message.name} ({message.email}) • Tel: {message.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-dark-500">
                          {formatDate(message.created_at)}
                        </span>
                        {!message.read_at && (
                          <button
                            onClick={() => markMessageAsRead(message.id)}
                            className="p-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                            title="Marcar como lida"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-dark-300 whitespace-pre-wrap">{message.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Copy Checklists Tab */}
        {activeTab === 'copy' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Resumo da Cópia */}
            {selectedChecklist && targetCompanyId && (
              <div className="mb-6 p-4 bg-dark-800/80 border border-primary-500/30 rounded-2xl">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Copy className="w-5 h-5 text-primary-400" />
                  Resumo da Cópia
                </h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 p-3 bg-dark-700/50 rounded-xl">
                    <p className="text-dark-400 text-xs mb-1">EMPRESA DE ORIGEM</p>
                    <p className="text-orange-400 font-medium">
                      {companies.find(c => c.id === sourceCompanyId)?.name || '-'}
                    </p>
                    <p className="text-white text-sm mt-1">
                      {sourceCompanyChecklists.find(c => c.id === selectedChecklist)?.title || '-'}
                    </p>
                    <p className="text-dark-500 text-xs">
                      {sourceCompanyChecklists.find(c => c.id === selectedChecklist)?.items_count || 0} itens
                    </p>
                  </div>
                  <ArrowRight className="w-8 h-8 text-primary-400 flex-shrink-0" />
                  <div className="flex-1 p-3 bg-dark-700/50 rounded-xl">
                    <p className="text-dark-400 text-xs mb-1">EMPRESA DE DESTINO</p>
                    <p className="text-green-400 font-medium">
                      {companies.find(c => c.id === targetCompanyId)?.name || '-'}
                    </p>
                    <p className="text-dark-500 text-sm mt-1">
                      {companies.find(c => c.id === targetCompanyId)?.owner_email || '-'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyChecklist}
                  disabled={copying}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copying ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {copying ? 'Copiando...' : 'Confirmar Cópia'}
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {/* 1. Selecionar Empresa de Origem */}
              <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-400">1.</span> Empresa de Origem
                </h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {companies.map(company => (
                    <div
                      key={company.id}
                      onClick={() => handleSelectSourceCompany(company.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        sourceCompanyId === company.id
                          ? 'bg-orange-500/20 border-2 border-orange-500'
                          : 'bg-dark-700/50 border border-transparent hover:bg-dark-700'
                      }`}
                    >
                      <p className="font-medium text-white">{company.name}</p>
                      <p className="text-sm text-dark-400">{company.owner_email}</p>
                      <p className="text-xs text-dark-500">{company.checklists_count || 0} checklists</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Selecionar Checklist */}
              <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400">2.</span> Selecionar Checklist
                </h3>
                
                {!sourceCompanyId ? (
                  <div className="text-center py-12 text-dark-400">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Selecione uma empresa de origem primeiro</p>
                  </div>
                ) : sourceCompanyChecklists.length === 0 ? (
                  <div className="text-center py-12 text-dark-400">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Esta empresa não possui checklists</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sourceCompanyChecklists.map(checklist => (
                      <div
                        key={checklist.id}
                        onClick={() => setSelectedChecklist(checklist.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          selectedChecklist === checklist.id
                            ? 'bg-yellow-500/20 border-2 border-yellow-500'
                            : 'bg-dark-700/50 border border-transparent hover:bg-dark-700'
                        }`}
                      >
                        <p className="font-medium text-white">{checklist.title}</p>
                        <p className="text-xs text-dark-500">{checklist.items_count || 0} itens</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Selecionar Empresa de Destino */}
              <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">3.</span> Empresa de Destino
                </h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {companies
                    .filter(c => c.id !== sourceCompanyId) // Não mostrar a empresa de origem
                    .map(company => (
                    <div
                      key={company.id}
                      onClick={() => setTargetCompanyId(company.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        targetCompanyId === company.id
                          ? 'bg-green-500/20 border-2 border-green-500'
                          : 'bg-dark-700/50 border border-transparent hover:bg-dark-700'
                      }`}
                    >
                      <p className="font-medium text-white">{company.name}</p>
                      <p className="text-sm text-dark-400">{company.owner_email}</p>
                    </div>
                  ))}
                </div>

                {!sourceCompanyId && (
                  <p className="text-dark-400 text-center text-sm py-4">
                    Selecione uma empresa de origem primeiro
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid md:grid-cols-3 gap-6">
              {/* Lista de Conversas */}
              <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary-400" />
                  Conversas
                </h3>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {supportConversations.length === 0 ? (
                    <p className="text-dark-400 text-center py-8">Nenhuma conversa</p>
                  ) : (
                    supportConversations.map(conv => (
                      <div
                        key={conv.company_id}
                        onClick={() => fetchConversationMessages(conv.company_id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          selectedConversation?.id === conv.company_id
                            ? 'bg-primary-500/20 border border-primary-500'
                            : 'bg-dark-700/50 border border-transparent hover:bg-dark-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-white">{conv.company_name}</p>
                            <p className="text-sm text-dark-400">{conv.user_name}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-dark-500 mt-1 truncate">{conv.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="md:col-span-2 bg-dark-800/50 border border-dark-700/50 rounded-2xl p-4 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="flex items-center gap-3 pb-4 border-b border-dark-700">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{selectedConversation.name}</p>
                        <p className="text-sm text-dark-400">{selectedConversation.email}</p>
                      </div>
                    </div>
                    
                    {/* Mensagens */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[400px]">
                      {conversationMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_from_master ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-xl ${
                            msg.is_from_master
                              ? 'bg-primary-500/20 text-white'
                              : 'bg-dark-700 text-white'
                          }`}>
                            <p className="text-xs text-dark-400 mb-1">
                              {msg.is_from_master ? 'Você' : msg.user_name} • {formatDate(msg.created_at)}
                            </p>
                            {msg.subject && <p className="font-medium text-sm mb-1">{msg.subject}</p>}
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Input de mensagem */}
                    <div className="pt-4 border-t border-dark-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Digite sua resposta..."
                          value={newSupportMessage}
                          onChange={(e) => setNewSupportMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendSupportMessage()}
                          className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500"
                        />
                        <button
                          onClick={sendSupportMessage}
                          disabled={!newSupportMessage.trim() || sendingMessage}
                          className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                        >
                          {sendingMessage ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Headphones className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                      <p className="text-dark-400">Selecione uma conversa para ver as mensagens</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, small }) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    rose: 'bg-rose-500/20 text-rose-400',
    orange: 'bg-orange-500/20 text-orange-400'
  }

  return (
    <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={`font-bold text-white ${small ? 'text-xl' : 'text-3xl'}`}>
        {value?.toLocaleString('pt-BR') || 0}
      </p>
      <p className="text-dark-400 text-sm">{label}</p>
    </div>
  )
}

// Company Detail Component
function CompanyDetail({ data, onBack, onUpdatePlan, formatDate, getPlanBadge }) {
  const { company, users, checklists, stats } = data

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar para lista
      </button>

      {/* Company Header */}
      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{company.name}</h2>
            <p className="text-dark-400">{company.email}</p>
            {company.cnpj && <p className="text-dark-500 text-sm">CNPJ: {company.cnpj}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-xl font-medium ${getPlanBadge(company.plan)}`}>
              {company.plan || 'free'}
            </span>
            <select
              value={company.plan || 'free'}
              onChange={(e) => onUpdatePlan(company.id, e.target.value)}
              className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white focus:border-primary-500"
            >
              <option value="trial">Trial</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-700">
          <div>
            <p className="text-dark-500 text-sm">Proprietário</p>
            <p className="text-white font-medium">{company.owner_name}</p>
          </div>
          <div>
            <p className="text-dark-500 text-sm">Criada em</p>
            <p className="text-white font-medium">{formatDate(company.created_at)}</p>
          </div>
          <div>
            <p className="text-dark-500 text-sm">Total Execuções</p>
            <p className="text-white font-medium">{stats?.total_executions || 0}</p>
          </div>
          <div>
            <p className="text-dark-500 text-sm">Execuções (30d)</p>
            <p className="text-white font-medium">{stats?.executions_30d || 0}</p>
          </div>
        </div>
      </div>

      {/* Users & Checklists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Users */}
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            Usuários ({users.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                <div>
                  <p className="text-white font-medium">{u.name}</p>
                  <p className="text-sm text-dark-400">{u.email}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {u.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Checklists */}
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary-400" />
            Checklists ({checklists.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {checklists.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                <div>
                  <p className="text-white font-medium">{c.title}</p>
                  <p className="text-sm text-dark-400">{c.periodicity}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {c.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

