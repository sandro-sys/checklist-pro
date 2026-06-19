import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, CheckCircle, Clock, Download, Eye, X, ClipboardList, ClipboardCheck, User, Share2, Copy, ExternalLink, QrCode } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

function StockShareModal({ list, onClose }) {
  const shareUrl = `${window.location.origin}/contar/${list.id}`
  const [qrCode, setQrCode] = useState(null)
  const [loadingQr, setLoadingQr] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get(`/qrcode/stock/${list.id}`)
      .then(({ data }) => setQrCode(data.qr_code))
      .catch(() => {})
      .finally(() => setLoadingQr(false))
  }, [list.id])

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiado!')
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-bold text-white">Compartilhar Lista</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-dark-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-dark-400 text-sm mb-4 truncate">{list.name}</p>

        {loadingQr ? (
          <div className="bg-dark-700/50 rounded-xl p-8 mb-4 text-center">
            <p className="text-dark-500 text-sm">Gerando QR Code...</p>
          </div>
        ) : qrCode ? (
          <div className="bg-white p-3 rounded-xl mb-4">
            <img src={qrCode} alt="QR Code" className="w-full aspect-square" />
          </div>
        ) : (
          <div className="bg-dark-700/50 border border-dashed border-dark-600 rounded-xl p-6 mb-4 text-center">
            <QrCode className="w-8 h-8 text-dark-500 mx-auto mb-2" />
            <p className="text-dark-500 text-sm">QR Code indisponível</p>
          </div>
        )}

        <div className="bg-dark-700 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
          <span className="text-dark-300 text-xs flex-1 truncate">{shareUrl}</span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copyLink}
              className="flex items-center justify-center gap-2 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Copy className="w-4 h-4" /> {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
            <button onClick={() => {
              const text = encodeURIComponent(`Olá! Por favor, preencha a contagem de estoque "${list.name}":\n${shareUrl}`)
              window.open(`https://wa.me/?text=${text}`, '_blank')
            }}
              className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
          </div>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-sm font-medium transition-colors">
            <ExternalLink className="w-4 h-4" /> Abrir em nova aba
          </a>
        </div>
      </div>
    </div>
  )
}

const TYPE_LABELS = { contagem: 'Contagem', compras: 'Compras', inventario: 'Inventário' }
const TYPE_COLORS = {
  contagem:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  compras:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inventario: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

function NewListModal({ onClose, onCreate, users }) {
  const [form, setForm] = useState({ name: '', type: 'contagem', notes: '', assigned_to: '' })
  const [saving, setSaving] = useState(false)

  const defaultName = () => {
    const d = new Date()
    const label = TYPE_LABELS[form.type] || form.type
    return `${label.toUpperCase()} ${d.toLocaleDateString('pt-BR')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const name = form.name.trim() || defaultName()
      const { data } = await api.post('/stock/lists', {
        ...form,
        name,
        assigned_to: form.assigned_to || undefined
      })
      toast.success('Lista criada')
      onCreate(data.list)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar lista')
    } finally {
      setSaving(false)
    }
  }

  const activeUsers = users.filter(u => u.is_active)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-lg font-bold text-white">Nova Lista</h2>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setForm({ ...form, type: val })}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.type === val ? TYPE_COLORS[val] : 'bg-dark-700 text-dark-400 border-dark-600 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Nome <span className="text-dark-500 text-xs">(opcional — gerado automaticamente)</span></label>
            <input
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 uppercase"
              placeholder={defaultName()}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Atribuir a <span className="text-dark-500 text-xs">(opcional)</span></label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              value={form.assigned_to}
              onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            >
              <option value="">— Sem atribuição —</option>
              {activeUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Observação <span className="text-dark-500 text-xs">(opcional)</span></label>
            <input
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              placeholder="Ex: Contagem mensal de março"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark-600 text-dark-300 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar e Editar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StockLists() {
  const [lists, setLists] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [shareList, setShareList] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const load = async () => {
    setLoading(true)
    try {
      const [listsRes, usersRes] = await Promise.all([
        api.get('/stock/lists'),
        api.get('/users')
      ])
      setLists(listsRes.data)
      setUsers(usersRes.data)
    } catch {
      toast.error('Erro ao carregar listas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleExport = async (list) => {
    try {
      const response = await api.get(`/stock/lists/${list.id}/export-txt`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/plain;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `estoque-${list.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erro ao exportar lista')
    }
  }

  const myPendingLists = lists.filter(l => l.assigned_to === user?.id && l.status === 'editing')
  const editingLists   = lists.filter(l => l.status === 'editing')
  const finalizedLists = lists.filter(l => l.status === 'finalizada')

  const ListCard = ({ list, highlight }) => (
    <div className={`border rounded-2xl p-5 transition-all ${
      highlight
        ? 'bg-primary-500/10 border-primary-500/30 hover:border-primary-500/50'
        : 'bg-dark-800/50 border-dark-700/50 hover:border-dark-600'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[list.type]}`}>
              {TYPE_LABELS[list.type]}
            </span>
            {list.status === 'finalizada' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Finalizada
              </span>
            )}
            {list.status === 'editing' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Em edição
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold mt-2 truncate">{list.name}</h3>
          {list.notes && <p className="text-dark-400 text-xs mt-0.5 truncate">{list.notes}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setShareList(list)} className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Compartilhar link de contagem">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleExport(list)} className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Exportar TXT">
            <Download className="w-4 h-4" />
          </button>
          {list.status === 'editing' && (
            <button onClick={() => navigate(`/estoque/listas/${list.id}/executar`)} className="p-2 text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Iniciar contagem">
              <ClipboardCheck className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => navigate(`/estoque/listas/${list.id}`)} className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors" title={list.status === 'editing' ? 'Configurar lista' : 'Ver lista'}>
            {list.status === 'editing' ? <FileText className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Atribuição */}
      {list.assigned_to_name && (
        <div className="flex items-center gap-1.5 mb-3">
          <User className="w-3 h-3 text-dark-500 flex-shrink-0" />
          <span className="text-xs text-dark-400 truncate">{list.assigned_to_name}</span>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-dark-500 pt-3 border-t border-dark-700/50">
        <span>{list.items_count} {list.items_count === 1 ? 'item' : 'itens'}</span>
        <span>•</span>
        <span>{list.created_by_name}</span>
        <span>•</span>
        <span>{new Date(list.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Listas de Estoque</h1>
          <p className="text-dark-400 text-sm mt-1">{lists.length} lista(s) criada(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all">
          <Plus className="w-4 h-4" /> Nova Lista
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-dark-400">Carregando...</div>
      ) : lists.length === 0 ? (
        <div className="py-20 text-center">
          <ClipboardList className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400 mb-2">Nenhuma lista criada ainda</p>
          <button onClick={() => setShowModal(true)} className="text-primary-400 hover:text-primary-300 text-sm">+ Criar primeira lista</button>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Minhas Contagens — visível só para quem tem listas atribuídas */}
          {myPendingLists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-4 h-4 text-primary-400" />
                <h2 className="text-sm font-semibold text-primary-400 uppercase tracking-wider">
                  Minhas Contagens ({myPendingLists.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {myPendingLists.map(l => (
                  <div key={l.id} className="flex flex-col gap-3">
                    <ListCard list={l} highlight />
                    <button
                      onClick={() => navigate(`/estoque/listas/${l.id}/executar`)}
                      className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <ClipboardCheck className="w-4 h-4" /> Iniciar Contagem
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editingLists.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Em Edição ({editingLists.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {editingLists.map(l => <ListCard key={l.id} list={l} />)}
              </div>
            </div>
          )}
          {finalizedLists.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Finalizadas ({finalizedLists.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {finalizedLists.map(l => <ListCard key={l.id} list={l} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NewListModal
          users={users}
          onClose={() => setShowModal(false)}
          onCreate={(list) => { setShowModal(false); navigate(`/estoque/listas/${list.id}`) }}
        />
      )}

      {shareList && (
        <StockShareModal
          list={shareList}
          onClose={() => setShareList(null)}
        />
      )}
    </div>
  )
}
