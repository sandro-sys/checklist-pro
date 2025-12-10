import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  Save,
  Loader2,
  Clock,
  Calendar,
  QrCode,
  Download,
  Copy,
  Eye
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

export default function ChecklistEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { company } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    periodicity: 'daily',
    schedule_time: '08:00',
    is_active: true,
    qr_code: '',
    items: []
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [checklistRes, categoriesRes] = await Promise.all([
        api.get(`/checklists/${id}`),
        api.get(`/companies/${company.id}/categories`)
      ])
      
      const checklist = checklistRes.data
      setFormData({
        title: checklist.title,
        description: checklist.description || '',
        category_id: checklist.category_id || '',
        periodicity: checklist.periodicity,
        schedule_time: checklist.schedule_time || '08:00',
        is_active: checklist.is_active === 1,
        qr_code: checklist.qr_code,
        items: checklist.items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          is_required: item.is_required === 1
        }))
      })
      setCategories(categoriesRes.data)
    } catch (error) {
      toast.error('Erro ao carregar checklist')
      navigate('/checklists')
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `new-${Date.now()}`,
          title: '',
          description: '',
          is_required: true
        }
      ]
    }))
  }

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

    setIsSaving(true)

    try {
      await api.put(`/checklists/${id}`, formData)
      toast.success('Checklist atualizado!')
      navigate('/checklists')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar checklist')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadQR = async () => {
    try {
      const response = await api.get(`/qrcode/download/${id}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${formData.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success('QR Code baixado!')
    } catch (error) {
      toast.error('Erro ao baixar QR Code')
    }
  }

  const copyExecuteLink = () => {
    const url = `${window.location.origin}/execute/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
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
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Editar Checklist</h1>
          <p className="text-dark-400 mt-1">{formData.title}</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="lg:col-span-2 space-y-6"
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
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Abertura da Casa"
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
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

              {/* Active */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="checkbox-custom"
                />
                <label className="text-sm text-dark-300">
                  Checklist ativo (disponível para execução)
                </label>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Itens do Checklist ({formData.items.length})
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Adicionar Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-dark-600 rounded-xl">
                <p className="text-dark-400 mb-4">Nenhum item adicionado</p>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar primeiro item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-4 bg-dark-700/30 rounded-xl group"
                  >
                    <div className="text-dark-500 cursor-move mt-2">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                        placeholder="Título do item"
                        className="w-full px-3 py-2 bg-dark-600/50 border border-dark-500 rounded-lg text-white placeholder-dark-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                      />
                      
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
                ))}
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
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Sidebar - QR Code */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* QR Code Card */}
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">QR Code</h2>
            </div>

            {formData.qr_code && (
              <div className="bg-white p-3 rounded-xl mb-4">
                <img
                  src={formData.qr_code}
                  alt="QR Code"
                  className="w-full aspect-square"
                />
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Baixar QR Code
              </button>
              <button
                type="button"
                onClick={copyExecuteLink}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copiar Link
              </button>
              <a
                href={`/execute/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Visualizar
              </a>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-primary-500/10 to-accent-teal/10 border border-primary-500/20 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-3">💡 Dicas</h3>
            <ul className="text-sm text-dark-300 space-y-2">
              <li>• Imprima o QR Code e cole no local de execução</li>
              <li>• Funcionários podem escanear para executar o checklist</li>
              <li>• Todas as execuções são registradas automaticamente</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

