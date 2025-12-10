import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Save,
  AlertCircle,
  ClipboardList,
  Users,
  Building2,
  Zap
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function QuickActions() {
  const { company } = useAuthStore()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (company?.id) {
      fetchCategories()
    } else {
      setIsLoading(false)
    }
  }, [company])

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/companies/${company.id}/categories`)
      setCategories(response.data)
    } catch (error) {
      toast.error('Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, description: category.description || '' })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome da categoria e obrigatorio')
      return
    }

    setIsSaving(true)

    try {
      if (editingCategory) {
        await api.put(`/companies/${company.id}/categories/${editingCategory.id}`, formData)
        toast.success('Categoria atualizada!')
      } else {
        await api.post(`/companies/${company.id}/categories`, formData)
        toast.success('Categoria criada!')
      }
      fetchCategories()
      closeModal()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar categoria')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (categoryId) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      await api.delete(`/companies/${company.id}/categories/${categoryId}`)
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      toast.success('Categoria excluida!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao excluir categoria')
    }
  }

  const getCategoryColor = (index) => {
    const colors = [
      'bg-primary-500',
      'bg-accent-teal',
      'bg-accent-amber',
      'bg-accent-violet',
      'bg-rose-500',
      'bg-cyan-500',
      'bg-orange-500',
      'bg-green-500'
    ]
    return colors[index % colors.length]
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-dark-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Empresa nao cadastrada</h2>
        <p className="text-dark-400">Cadastre sua empresa primeiro para acessar as acoes rapidas.</p>
        <Link
          to="/company"
          className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Cadastrar Empresa
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Acoes Rapidas</h1>
        <p className="text-dark-400 mt-1">Acesse rapidamente as principais funcoes do sistema</p>
      </motion.div>

      {/* Quick Action Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        <Link
          to="/checklists/create"
          className="bg-gradient-to-br from-primary-500/20 to-accent-teal/20 border border-primary-500/30 rounded-2xl p-6 hover:border-primary-500/50 transition-all group"
        >
          <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-primary-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Criar Checklist</h3>
          <p className="text-dark-400 text-sm">Novo processo de verificacao</p>
        </Link>

        <Link
          to="/checklists"
          className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 hover:border-dark-600 transition-all group"
        >
          <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-6 h-6 text-dark-300" />
          </div>
          <h3 className="font-semibold text-white mb-1">Ver Checklists</h3>
          <p className="text-dark-400 text-sm">Gerenciar todos os processos</p>
        </Link>

        <Link
          to="/team"
          className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 hover:border-dark-600 transition-all group"
        >
          <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-dark-300" />
          </div>
          <h3 className="font-semibold text-white mb-1">Gerenciar Equipe</h3>
          <p className="text-dark-400 text-sm">Colaboradores e funcoes</p>
        </Link>

        <Link
          to="/company"
          className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 hover:border-dark-600 transition-all group"
        >
          <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6 text-dark-300" />
          </div>
          <h3 className="font-semibold text-white mb-1">Configuracoes</h3>
          <p className="text-dark-400 text-sm">Dados da empresa</p>
        </Link>
      </motion.div>

      {/* Categories Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-teal/20 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-accent-teal" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Categorias</h2>
              <p className="text-dark-400 text-sm">Organize seus checklists</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-accent-teal/20 text-accent-teal rounded-xl hover:bg-accent-teal/30 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 mb-4">Nenhuma categoria criada ainda</p>
            <button
              onClick={() => openModal()}
              className="text-accent-teal hover:text-teal-400 text-sm font-medium"
            >
              Criar primeira categoria
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="bg-dark-700/30 border border-dark-600/30 rounded-xl p-4 group hover:border-dark-500 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${getCategoryColor(index)} rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0`}>
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{category.name}</h3>
                    {category.description && (
                      <p className="text-dark-400 text-sm truncate">{category.description}</p>
                    )}
                    <p className="text-dark-500 text-xs mt-1">
                      {category.checklists_count || 0} checklist(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(category)}
                      className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-dark-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-1.5 text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Limpeza, Seguranca, Qualidade..."
                    className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Descricao (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o proposito desta categoria..."
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white rounded-xl transition-colors font-medium disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="spinner w-5 h-5"></div>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

