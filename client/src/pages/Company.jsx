import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Save, 
  Loader2,
  Plus,
  Tag,
  Lock,
  CheckCircle2
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Company() {
  const { company, setCompany } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [categories, setCategories] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: ''
  })

  const [newCategory, setNewCategory] = useState({ name: '', description: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const companyRes = await api.get('/companies/my-company')
      const companyData = companyRes.data
      setCompany(companyData)
      setFormData({
        name: companyData.name || '',
        cnpj: companyData.cnpj || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: companyData.address || ''
      })

      // Fetch categories
      const categoriesRes = await api.get(`/companies/${companyData.id}/categories`)
      setCategories(categoriesRes.data || [])
    } catch (error) {
      if (error.response?.status === 404) {
        // No company yet
      } else {
        console.error('Erro ao carregar dados:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCompany = async (e) => {
    e.preventDefault()
    
    // Não permite edição se já tem empresa
    if (company) {
      toast.error('Não é possível editar os dados da empresa após o cadastro')
      return
    }
    
    if (!formData.name) {
      toast.error('Nome da empresa é obrigatório')
      return
    }

    setIsSaving(true)

    try {
      const response = await api.post('/companies', formData)
      setCompany(response.data.company)
      toast.success('Empresa criada com sucesso!')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    
    if (!newCategory.name) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    try {
      const response = await api.post(`/companies/${company.id}/categories`, newCategory)
      setCategories([...categories, response.data.category])
      setNewCategory({ name: '', description: '' })
      toast.success('Categoria criada!')
    } catch (error) {
      toast.error('Erro ao criar categoria')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  // Se não tem empresa, mostra formulário de cadastro
  if (!company) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Cadastrar Empresa</h1>
          <p className="text-dark-400 mt-1">Configure sua empresa para começar a usar o sistema</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveCompany}
          className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Dados da Empresa</h2>
              <p className="text-sm text-dark-400">Preencha os dados do seu negócio</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium">Atenção</p>
                <p className="text-amber-400/80 text-sm">
                  Após o cadastro, os dados da empresa não poderão ser alterados. 
                  Certifique-se de preencher corretamente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do seu negócio"
                required
                className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
                className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
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

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
                className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 btn-glow"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Criar Empresa
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    )
  }

  // Se já tem empresa, mostra visualização (sem edição) e categorias
  const tabs = [
    { id: 'info', label: 'Informações', icon: Building2 },
    { id: 'categories', label: 'Categorias', icon: Tag }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Minha Empresa</h1>
          <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 text-sm font-medium rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            Ativa
          </span>
        </div>
        <p className="text-dark-400 mt-1">Visualize os dados da sua empresa</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Company Info Tab - Apenas Visualização */}
        {activeTab === 'info' && (
          <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Dados da Empresa</h2>
                  <p className="text-sm text-dark-400">Informações cadastradas</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 rounded-lg text-dark-400 text-sm">
                <Lock className="w-4 h-4" />
                Somente leitura
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark-500 mb-1">
                  Nome da Empresa
                </label>
                <p className="text-lg font-semibold text-white">{company.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-1">
                  CNPJ
                </label>
                <p className="text-white">{company.cnpj || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-1">
                  Email
                </label>
                <p className="text-white">{company.email || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-1">
                  Telefone
                </label>
                <p className="text-white">{company.phone || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-1">
                  Endereço
                </label>
                <p className="text-white">{company.address || '-'}</p>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-dark-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-dark-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-primary-400">{company.total_checklists || 0}</p>
                    <p className="text-sm text-dark-400">Checklists</p>
                  </div>
                  <div className="text-center p-4 bg-dark-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-accent-teal">{company.total_users || 1}</p>
                    <p className="text-sm text-dark-400">Usuários</p>
                  </div>
                  <div className="text-center p-4 bg-dark-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-accent-amber">{categories.length}</p>
                    <p className="text-sm text-dark-400">Categorias</p>
                  </div>
                  <div className="text-center p-4 bg-dark-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-accent-violet">
                      {new Date(company.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-sm text-dark-400">Criada em</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Add Category */}
            <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Nova Categoria</h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Nome da Categoria *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Ex: Manutenção, Qualidade..."
                      className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Descrição da categoria"
                      className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar Categoria
                  </button>
                </div>
              </form>
            </div>

            {/* Categories List */}
            <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Categorias ({categories.length})</h3>
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">Nenhuma categoria cadastrada</p>
                  <p className="text-sm text-dark-500 mt-1">Adicione categorias para organizar seus checklists</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-4 bg-dark-700/30 rounded-xl"
                    >
                      <span className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 font-bold">{cat.name.charAt(0).toUpperCase()}</span>
                      <div className="flex-1">
                        <p className="font-medium text-white">{cat.name}</p>
                        <p className="text-sm text-dark-400">
                          {cat.description || `${cat.total_checklists || 0} checklists`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
