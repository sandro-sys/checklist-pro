import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, CheckCircle, Clock, Download, Eye, X, ClipboardList, ClipboardCheck } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_LABELS = { contagem: 'Contagem', compras: 'Compras', inventario: 'Inventário' }
const TYPE_COLORS = {
  contagem:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  compras:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inventario: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

function NewListModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', type: 'contagem', notes: '' })
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
      const { data } = await api.post('/stock/lists', { ...form, name })
      toast.success('Lista criada')
      onCreate(data.list)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar lista')
    } finally {
      setSaving(false)
    }
  }

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
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/stock/lists')
      setLists(data)
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

  const editingLists = lists.filter(l => l.status === 'editing')
  const finalizedLists = lists.filter(l => l.status === 'finalizada')

  const ListCard = ({ list }) => (
    <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-5 hover:border-dark-600 transition-all">
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
      <div className="flex items-center gap-4 text-xs text-dark-500 mt-3 pt-3 border-t border-dark-700/50">
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
        <div className="space-y-6">
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
          onClose={() => setShowModal(false)}
          onCreate={(list) => { setShowModal(false); navigate(`/estoque/listas/${list.id}`) }}
        />
      )}
    </div>
  )
}
