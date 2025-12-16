import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  Sparkles,
  Save,
  Loader2,
  Clock,
  Calendar,
  ChevronDown,
  Building2,
  ArrowRight,
  Camera,
  FileText,
  CheckSquare,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const PERIODICITY_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'shift', label: 'Por Turno' },
  { value: 'custom', label: 'Personalizado' }
]

const ITEM_TYPE_OPTIONS = [
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Item padrão para marcar' },
  { value: 'image', label: 'Foto', icon: Camera, description: 'Exige upload de imagem' },
  { value: 'text', label: 'Dissertativo', icon: FileText, description: 'Resposta em texto (até 30 palavras)' }
]

const MAX_IMAGE_ITEMS = 2

// Categorias padrão caso não tenha empresa
const DEFAULT_CATEGORIES = [
  { id: 'abertura', name: 'Abertura' },
  { id: 'fechamento', name: 'Fechamento' },
  { id: 'cozinha', name: 'Cozinha' },
  { id: 'operacao', name: 'Operação' },
  { id: 'limpeza', name: 'Limpeza' },
  { id: 'seguranca', name: 'Segurança' }
]

export default function ChecklistCreate() {
  const navigate = useNavigate()
  const { company, setCompany } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [showTemplates, setShowTemplates] = useState(true)
  const [currentCompany, setCurrentCompany] = useState(company)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    periodicity: 'daily',
    schedule_time: '08:00',
    items: []
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoadingData(true)
    try {
      // Primeiro, tentar buscar a empresa do usuário
      let companyData = company
      
      if (!companyData) {
        try {
          const companyRes = await api.get('/companies/my-company')
          companyData = companyRes.data
          setCompany(companyData)
          setCurrentCompany(companyData)
        } catch (err) {
          // Usuário não tem empresa, usar categorias padrão
          console.log('Usuário sem empresa cadastrada')
        }
      }

      // Buscar templates (não depende de empresa)
      try {
        const templatesRes = await api.get('/checklists/templates')
        setTemplates(templatesRes.data || [])
      } catch (err) {
        setTemplates([])
      }

      // Buscar categorias da empresa ou usar padrão
      if (companyData?.id) {
        try {
          const categoriesRes = await api.get(`/companies/${companyData.id}/categories`)
          setCategories(categoriesRes.data || [])
        } catch (err) {
          setCategories(DEFAULT_CATEGORIES)
        }
      } else {
        setCategories(DEFAULT_CATEGORIES)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setCategories(DEFAULT_CATEGORIES)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleTemplateSelect = async (templateId) => {
    try {
      const response = await api.get(`/checklists/templates/${templateId}`)
      const template = response.data

      setFormData({
        ...formData,
        title: template.title,
        description: template.description,
        periodicity: template.periodicity,
        schedule_time: template.schedule_time || '08:00',
        items: template.items.map((item, index) => ({
          id: `item-${index}`,
          title: item.title,
          description: item.description || '',
          is_required: item.is_required,
          item_type: item.item_type || 'checkbox'
        }))
      })
      setShowTemplates(false)
      toast.success('Template aplicado!')
    } catch (error) {
      toast.error('Erro ao carregar template')
    }
  }

  const handleSuggestPeriodicity = async () => {
    if (!formData.title) return

    try {
      const response = await api.post('/checklists/suggest-periodicity', {
        title: formData.title
      })
      setFormData(prev => ({
        ...prev,
        periodicity: response.data.periodicity,
        schedule_time: response.data.schedule_time
      }))
      toast.success('Sugestão aplicada!')
    } catch (error) {
      console.error('Erro na sugestão:', error)
    }
  }

  const addItem = (itemType = 'checkbox') => {
    // Verificar limite de itens com imagem
    if (itemType === 'image') {
      const imageItemsCount = formData.items.filter(i => i.item_type === 'image').length
      if (imageItemsCount >= MAX_IMAGE_ITEMS) {
        toast.error(`Limite de ${MAX_IMAGE_ITEMS} itens com foto atingido`)
        return
      }
    }

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          title: '',
          description: '',
          is_required: true,
          item_type: itemType
        }
      ]
    }))
  }

  // Contar itens por tipo
  const imageItemsCount = formData.items.filter(i => i.item_type === 'image').length
  const canAddImageItem = imageItemsCount < MAX_IMAGE_ITEMS

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title) {
      toast.error('Título é obrigatório')
      return
    }

    if (formData.items.length === 0) {
      toast.error('Adicione pelo menos um item ao checklist')
      return
    }

    const emptyItems = formData.items.filter(item => !item.title.trim())
    if (emptyItems.length > 0) {
      toast.error('Preencha o título de todos os itens')
      return
    }

    // Verificar se tem empresa
    if (!currentCompany?.id) {
      toast.error('Você precisa cadastrar uma empresa primeiro')
      navigate('/company')
      return
    }

    setIsLoading(true)

    try {
      await api.post('/checklists', {
        ...formData,
        company_id: currentCompany.id
      })
      toast.success('Checklist criado com sucesso!')
      navigate('/checklists')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar checklist')
    } finally {
      setIsLoading(false)
    }
  }

  // Se ainda está carregando dados
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  // Se não tem empresa, mostrar aviso
  if (!currentCompany) {
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
          Para criar checklists, você precisa primeiro cadastrar sua empresa. 
          Isso permitirá organizar seus processos e gerenciar sua equipe.
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Novo Checklist</h1>
          <p className="text-dark-400 mt-1">Crie um novo processo para sua operação</p>
        </div>
      </motion.div>

      {/* Templates */}
      {showTemplates && templates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-primary-500/10 to-accent-teal/10 border border-primary-500/20 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Templates Prontos</h2>
          </div>
          <p className="text-dark-400 text-sm mb-4">
            Comece rapidamente com um de nossos templates pré-configurados
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className="p-4 bg-dark-800/50 hover:bg-dark-800 border border-dark-700 hover:border-primary-500/50 rounded-xl text-left transition-all group"
              >
                <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                  {template.title}
                </h3>
                <p className="text-sm text-dark-400 mt-1">
                  {template.items_count} itens • {template.periodicity === 'daily' ? 'Diário' : template.periodicity}
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTemplates(false)}
            className="mt-4 text-sm text-dark-400 hover:text-white"
          >
            Ou criar do zero →
          </button>
        </motion.div>
      )}

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Info */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informações Básicas</h2>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Título do Checklist *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onBlur={handleSuggestPeriodicity}
                  placeholder="Ex: Abertura da Casa"
                  className="flex-1 px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo deste checklist..."
                rows={3}
                className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Categoria
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white appearance-none cursor-pointer focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Periodicity & Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Periodicidade
                </label>
                <select
                  value={formData.periodicity}
                  onChange={(e) => setFormData({ ...formData, periodicity: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white appearance-none cursor-pointer focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                >
                  {PERIODICITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Horário Sugerido
                </label>
                <input
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Itens do Checklist ({formData.items.length})
              </h2>
              {imageItemsCount > 0 && (
                <p className="text-xs text-dark-400 mt-1">
                  <Camera className="w-3 h-3 inline mr-1" />
                  {imageItemsCount}/{MAX_IMAGE_ITEMS} itens com foto
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addItem('checkbox')}
                className="flex items-center gap-2 px-3 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors text-sm font-medium"
                title="Adicionar item checkbox"
              >
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Checkbox</span>
              </button>
              <button
                type="button"
                onClick={() => addItem('image')}
                disabled={!canAddImageItem}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={canAddImageItem ? 'Adicionar item com foto' : `Limite de ${MAX_IMAGE_ITEMS} fotos atingido`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Foto</span>
              </button>
              <button
                type="button"
                onClick={() => addItem('text')}
                className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors text-sm font-medium"
                title="Adicionar item dissertativo"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Texto</span>
              </button>
            </div>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-dark-600 rounded-xl">
              <p className="text-dark-400 mb-4">Nenhum item adicionado</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => addItem('checkbox')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  Checkbox
                </button>
                <button
                  type="button"
                  onClick={() => addItem('image')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 text-amber-400 rounded-lg hover:bg-dark-600 transition-colors text-sm"
                >
                  <Camera className="w-4 h-4" />
                  Com Foto
                </button>
                <button
                  type="button"
                  onClick={() => addItem('text')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 text-teal-400 rounded-lg hover:bg-dark-600 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Dissertativo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item, index) => {
                const itemType = ITEM_TYPE_OPTIONS.find(t => t.value === (item.item_type || 'checkbox'))
                const TypeIcon = itemType?.icon || CheckSquare
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-3 p-4 rounded-xl group ${
                      item.item_type === 'image' 
                        ? 'bg-amber-500/5 border border-amber-500/20' 
                        : item.item_type === 'text'
                        ? 'bg-teal-500/5 border border-teal-500/20'
                        : 'bg-dark-700/30'
                    }`}
                  >
                    <div className="text-dark-500 cursor-move mt-2">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    {/* Indicador de tipo */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 ${
                      item.item_type === 'image'
                        ? 'bg-amber-500/20 text-amber-400'
                        : item.item_type === 'text'
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'bg-primary-500/20 text-primary-400'
                    }`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(index, 'title', e.target.value)}
                          placeholder={
                            item.item_type === 'image' 
                              ? 'Ex: Foto do equipamento' 
                              : item.item_type === 'text'
                              ? 'Ex: Observações gerais'
                              : 'Título do item'
                          }
                          className="flex-1 px-3 py-2 bg-dark-600/50 border border-dark-500 rounded-lg text-white placeholder-dark-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                        />
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.item_type === 'image'
                            ? 'bg-amber-500/20 text-amber-400'
                            : item.item_type === 'text'
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-primary-500/20 text-primary-400'
                        }`}>
                          {itemType?.label}
                        </span>
                      </div>
                      
                      {item.item_type === 'text' && (
                        <p className="text-xs text-dark-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Resposta limitada a 30 palavras
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.is_required}
                            onChange={(e) => updateItem(index, 'is_required', e.target.checked)}
                            className="checkbox-custom w-5 h-5"
                          />
                          <span className="text-sm text-dark-400">Obrigatório</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-dark-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 text-dark-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Criar Checklist
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

