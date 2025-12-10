import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Shield,
  MoreVertical,
  UserPlus,
  X,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  ArrowRight
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Team() {
  const { user, company, setCompany } = useAuthStore()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompany, setHasCompany] = useState(!!company)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('users')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Primeiro verificar se tem empresa
      let companyData = company
      if (!companyData) {
        try {
          const companyRes = await api.get('/companies/my-company')
          companyData = companyRes.data
          setCompany(companyData)
          setHasCompany(true)
        } catch (err) {
          // Usuário não tem empresa
          setHasCompany(false)
          setIsLoading(false)
          return
        }
      }

      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ])
      setUsers(usersRes.data || [])
      setRoles(rolesRes.data || [])
    } catch (error) {
      if (error.response?.status === 400) {
        // Usuário sem empresa
        setHasCompany(false)
      } else {
        toast.error('Erro ao carregar dados')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  )

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return

    try {
      await api.delete(`/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('Usuário removido')
      setActiveMenu(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao remover usuário')
    }
  }

  const handleToggleUserActive = async (userId) => {
    try {
      const response = await api.put(`/users/${userId}/toggle-active`)
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: response.data.is_active ? 1 : 0 } : u
      ))
      toast.success(response.data.message)
      setActiveMenu(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar status')
    }
  }

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Tem certeza que deseja remover este cargo?')) return

    try {
      await api.delete(`/roles/${roleId}`)
      setRoles(prev => prev.filter(r => r.id !== roleId))
      toast.success('Cargo removido')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao remover cargo')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  // Se não tem empresa, mostrar aviso
  if (!hasCompany) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center py-12"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-accent-teal/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Cadastre sua Empresa Primeiro!</h1>
        <p className="text-dark-400 text-lg mb-8">
          Para gerenciar sua equipe, você precisa primeiro cadastrar sua empresa. 
          Isso permitirá adicionar colaboradores e definir cargos.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Equipe</h1>
          <p className="text-dark-400 mt-1">Gerencie usuários e cargos da sua empresa</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            setShowUserModal(true)
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all btn-glow"
        >
          <UserPlus className="w-5 h-5" />
          Novo Colaborador
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Colaboradores ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'roles'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Cargos ({roles.length})
        </button>
      </motion.div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Users List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum colaborador cadastrado'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-dark-800/50 border rounded-xl p-5 ${
                    member.is_active ? 'border-dark-700/50' : 'border-rose-500/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                      member.is_active 
                        ? 'bg-gradient-to-br from-primary-500/20 to-accent-teal/20 text-primary-400'
                        : 'bg-dark-700 text-dark-500'
                    }`}>
                      {member.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{member.name}</h3>
                        {!member.is_active && (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-xs rounded-full">
                            Inativo
                          </span>
                        )}
                        {member.id === user?.id && (
                          <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 text-xs rounded-full">
                            Você
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dark-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {member.phone}
                          </span>
                        )}
                      </div>

                      {/* Role Badge */}
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          member.role_type === 'owner' 
                            ? 'bg-accent-amber/10 text-accent-amber'
                            : 'bg-dark-700 text-dark-300'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {member.role_name || (member.role_type === 'owner' ? 'Proprietário' : 'Sem cargo')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {member.id !== user?.id && (
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                          className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {activeMenu === member.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-1 w-48 py-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-20"
                            >
                              <button
                                onClick={() => {
                                  setEditingUser(member)
                                  setShowUserModal(true)
                                  setActiveMenu(null)
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700/50"
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleToggleUserActive(member.id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700/50"
                              >
                                {member.is_active ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    Ativar
                                  </>
                                )}
                              </button>
                              <hr className="my-2 border-dark-700" />
                              <button
                                onClick={() => handleDeleteUser(member.id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remover
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Add Role Button */}
          <button
            onClick={() => {
              setEditingRole(null)
              setShowRoleModal(true)
            }}
            className="w-full p-4 border-2 border-dashed border-dark-600 rounded-xl text-dark-400 hover:text-white hover:border-primary-500/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Novo Cargo
          </button>

          {/* Roles List */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-accent-violet/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent-violet" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingRole(role)
                        setShowRoleModal(true)
                      }}
                      className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1.5 text-dark-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">{role.name}</h3>
                {role.description && (
                  <p className="text-sm text-dark-400 mb-3">{role.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-dark-500">
                  <Users className="w-4 h-4" />
                  <span>{role.users_count || 0} colaborador(es)</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setEditingUser(null)
        }}
        user={editingUser}
        roles={roles}
        onSuccess={() => {
          fetchData()
          setShowUserModal(false)
          setEditingUser(null)
        }}
      />

      {/* Role Modal */}
      <RoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false)
          setEditingRole(null)
        }}
        role={editingRole}
        onSuccess={() => {
          fetchData()
          setShowRoleModal(false)
          setEditingRole(null)
        }}
      />

      {/* Click outside to close menu */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  )
}

// User Modal Component
function UserModal({ isOpen, onClose, user, roles, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role_id: user.role_id || ''
      })
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role_id: ''
      })
    }
  }, [user, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (user) {
        // Update
        await api.put(`/users/${user.id}`, {
          name: formData.name,
          phone: formData.phone,
          role_id: formData.role_id || null
        })
        toast.success('Colaborador atualizado!')
      } else {
        // Create
        const response = await api.post('/users', formData)
        if (response.data.temporary_password) {
          toast.success(`Colaborador criado! Senha temporária: ${response.data.temporary_password}`, {
            duration: 10000
          })
        } else {
          toast.success('Colaborador criado!')
        }
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {user ? 'Editar Colaborador' : 'Novo Colaborador'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Nome completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do colaborador"
              required
              className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
              disabled={!!user}
              className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Senha (opcional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Deixe vazio para gerar automaticamente"
                  className="w-full px-4 py-3 pr-12 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
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
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Cargo
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white appearance-none cursor-pointer focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            >
              <option value="">Selecione um cargo</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {user ? 'Salvar' : 'Criar'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Role Modal Component
function RoleModal({ isOpen, onClose, role, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || ''
      })
    } else {
      setFormData({
        name: '',
        description: ''
      })
    }
  }, [role, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (role) {
        await api.put(`/roles/${role.id}`, formData)
        toast.success('Cargo atualizado!')
      } else {
        await api.post('/roles', formData)
        toast.success('Cargo criado!')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {role ? 'Editar Cargo' : 'Novo Cargo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Nome do cargo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Supervisor, Cozinheiro..."
              required
              className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva as responsabilidades deste cargo..."
              rows={3}
              className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {role ? 'Salvar' : 'Criar'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

