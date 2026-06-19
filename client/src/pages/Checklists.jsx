import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter,
  ClipboardList,
  QrCode,
  Edit,
  History,
  MoreVertical,
  Trash2,
  Copy,
  Eye,
  Download,
  Share2,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Checklists() {
  const { company } = useAuthStore()
  const [checklists, setChecklists] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)
  const [showQRModal, setShowQRModal] = useState(null)

  useEffect(() => {
    if (company?.id) {
      fetchData()
    }
  }, [company])

  const fetchData = async () => {
    try {
      const [checklistsRes, categoriesRes] = await Promise.all([
        api.get(`/checklists/company/${company.id}`),
        api.get(`/companies/${company.id}/categories`)
      ])
      setChecklists(checklistsRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      toast.error('Erro ao carregar checklists')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este checklist?')) return

    try {
      await api.delete(`/checklists/${id}`)
      setChecklists(prev => prev.filter(c => c.id !== id))
      toast.success('Checklist excluído')
      setActiveMenu(null)
    } catch (error) {
      toast.error('Erro ao excluir checklist')
    }
  }

  const handleDownloadQR = async (checklist) => {
    try {
      const response = await api.get(`/qrcode/download/${checklist.id}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${checklist.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success('QR Code baixado!')
    } catch (error) {
      toast.error('Erro ao baixar QR Code')
    }
  }

  const getExecuteLink = (id) => {
    return `${window.location.origin}/execute/${id}`
  }

  const copyExecuteLink = (id) => {
    const url = getExecuteLink(id)
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
    setActiveMenu(null)
  }

  const shareLink = async (checklist) => {
    const url = getExecuteLink(checklist.id)
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: checklist.title,
          text: `Execute o checklist: ${checklist.title}`,
          url: url
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyExecuteLink(checklist.id)
        }
      }
    } else {
      copyExecuteLink(checklist.id)
    }
  }

  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = checklist.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || checklist.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
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
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Checklists</h1>
          <p className="text-dark-400 mt-1">Gerencie seus processos e checklists</p>
        </div>
        <Link
          to="/checklists/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all btn-glow"
        >
          <Plus className="w-5 h-5" />
          Novo Checklist
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar checklist..."
            className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-12 pr-10 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white appearance-none cursor-pointer focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all min-w-[200px]"
          >
            <option value="">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Checklists Grid */}
      {filteredChecklists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <ClipboardList className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Nenhum checklist encontrado</h3>
          <p className="text-dark-400 mb-6">
            {searchTerm || selectedCategory 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro checklist'}
          </p>
          {!searchTerm && !selectedCategory && (
            <Link
              to="/checklists/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500/10 text-primary-400 font-medium rounded-xl hover:bg-primary-500/20 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Checklist
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChecklists.map((checklist, index) => (
            <motion.div
              key={checklist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-5 card-hover relative group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-400 font-bold">
                    {checklist.title?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <span className="text-xs text-dark-400 uppercase tracking-wider">
                      {checklist.category_name || 'Sem categoria'}
                    </span>
                    <h3 className="font-semibold text-white mt-0.5 line-clamp-1">
                      {checklist.title}
                    </h3>
                  </div>
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === checklist.id ? null : checklist.id)}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {activeMenu === checklist.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 w-48 py-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-20"
                      >
                        <Link
                          to={`/checklists/${checklist.id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700/50"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Link>
                        <Link
                          to={`/checklists/${checklist.id}/history`}
                          className="flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700/50"
                        >
                          <History className="w-4 h-4" />
                          Histórico
                        </Link>
                        <button
                          onClick={() => copyExecuteLink(checklist.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700/50"
                        >
                          <Copy className="w-4 h-4" />
                          Copiar Link
                        </button>
                        <button
                          onClick={() => setShowQRModal(checklist)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700/50"
                        >
                          <QrCode className="w-4 h-4" />
                          Ver QR Code
                        </button>
                        <hr className="my-2 border-dark-700" />
                        <button
                          onClick={() => handleDelete(checklist.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Description */}
              {checklist.description && (
                <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                  {checklist.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
                <span>{checklist.items_count} itens</span>
                <span>•</span>
                <span>{checklist.executions_count} execuções</span>
              </div>

              {/* Periodicity Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  checklist.periodicity === 'daily' ? 'bg-primary-500/10 text-primary-400' :
                  checklist.periodicity === 'weekly' ? 'bg-accent-teal/10 text-accent-teal' :
                  checklist.periodicity === 'monthly' ? 'bg-accent-amber/10 text-accent-amber' :
                  'bg-dark-700 text-dark-300'
                }`}>
                  {checklist.periodicity === 'daily' ? 'Diário' :
                   checklist.periodicity === 'weekly' ? 'Semanal' :
                   checklist.periodicity === 'monthly' ? 'Mensal' :
                   checklist.periodicity === 'shift' ? 'Por Turno' : 'Personalizado'}
                </span>
                {checklist.schedule_time && (
                  <span className="text-xs text-dark-500">às {checklist.schedule_time}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  to={`/checklists/${checklist.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Link>
                <button
                  onClick={() => setShowQRModal(checklist)}
                  className="flex items-center justify-center w-11 h-11 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-xl transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQRModal(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white text-center mb-2">
                QR Code
              </h3>
              <p className="text-dark-400 text-center text-sm mb-6">
                {showQRModal.title}
              </p>

              {/* QR Code Image */}
              {showQRModal.qr_code ? (
                <div className="bg-white p-4 rounded-xl mb-4">
                  <img
                    src={showQRModal.qr_code}
                    alt="QR Code"
                    className="w-full aspect-square"
                  />
                </div>
              ) : (
                <div className="bg-dark-700/50 border border-dashed border-dark-600 rounded-xl p-8 mb-4 text-center">
                  <QrCode className="w-10 h-10 text-dark-500 mx-auto mb-2" />
                  <p className="text-dark-400 text-sm mb-3">QR Code não gerado</p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { data } = await api.post(`/checklists/${showQRModal.id}/regenerate-qrcode`)
                        setShowQRModal(prev => ({ ...prev, qr_code: data.qr_code }))
                        toast.success('QR Code gerado!')
                      } catch { toast.error('Erro ao gerar QR Code') }
                    }}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                  >
                    Gerar QR Code
                  </button>
                </div>
              )}

              {/* Shareable Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Link compartilhavel
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getExecuteLink(showQRModal.id)}
                    className="flex-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-dark-300 text-sm truncate"
                  />
                  <button
                    onClick={() => copyExecuteLink(showQRModal.id)}
                    className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadQR(showQRModal)}
                    disabled={!showQRModal.qr_code}
                    className="flex items-center justify-center gap-2 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Baixar QR
                  </button>
                  <button
                    onClick={() => {
                      const url = getExecuteLink(showQRModal.id)
                      const text = encodeURIComponent(`Execute o checklist "${showQRModal.title}":\n${url}`)
                      window.open(`https://wa.me/?text=${text}`, '_blank')
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
                <a
                  href={getExecuteLink(showQRModal.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors font-medium text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em nova aba
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

