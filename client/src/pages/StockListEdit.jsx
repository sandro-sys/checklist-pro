import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Download, CheckCircle, AlertTriangle, Search, Package, Edit2, Save, X, ClipboardCheck } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_LABELS = { contagem: 'Contagem de Estoque', compras: 'Lista de Compras', inventario: 'Inventário' }
const UNITS = ['UN', 'KG', 'G', 'L', 'ML', 'CX', 'SC', 'PC', 'DZ', 'MT']

function AddItemRow({ listId, products, onAdded }) {
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('UN')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [productId, setProductId] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  const suggestions = search.length >= 1
    ? products.filter(p => p.name.includes(search.toUpperCase())).slice(0, 6)
    : []

  const selectProduct = (p) => {
    setProductId(p.id)
    setName(p.name)
    setUnit(p.unit)
    setSearch(p.name)
    setShowSuggestions(false)
    setTimeout(() => document.getElementById('qty-input')?.focus(), 50)
  }

  const handleSearchChange = (val) => {
    setSearch(val.toUpperCase())
    setName(val.toUpperCase())
    setProductId(null)
    setShowSuggestions(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Informe o nome do produto')
    setSaving(true)
    try {
      const { data } = await api.post(`/stock/lists/${listId}/items`, {
        product_id: productId || undefined,
        name,
        unit,
        quantity: quantity !== '' ? parseFloat(quantity) : undefined,
        notes: notes || undefined
      })
      onAdded(data.item)
      setSearch(''); setName(''); setUnit('UN'); setQuantity(''); setNotes(''); setProductId(null)
      inputRef.current?.focus()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dark-700/50 border border-dark-600 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Adicionar Item</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          ref={inputRef}
          className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 uppercase text-sm"
          placeholder="Nome do produto ou ingrediente..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-xl z-20 overflow-hidden">
            {suggestions.map(p => (
              <button key={p.id} type="button" onMouseDown={() => selectProduct(p)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-dark-700 text-left transition-colors">
                <span className="text-white text-sm">{p.name}</span>
                <span className="text-dark-400 text-xs">{parseFloat(p.current_stock).toLocaleString('pt-BR')} {p.unit}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-dark-400 mb-1">Unidade</label>
          <select className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            value={unit} onChange={e => setUnit(e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-dark-400 mb-1">Quantidade</label>
          <input id="qty-input" type="number" min="0" step="0.001"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            placeholder="0,000" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-dark-400 mb-1">Observação</label>
          <input className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            placeholder="Opcional..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={saving}
        className="w-full py-2.5 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-xl text-sm font-semibold hover:bg-primary-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> {saving ? 'Adicionando...' : 'Adicionar à Lista'}
      </button>
    </form>
  )
}

function ItemRow({ item, finalized, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: item.name, unit: item.unit || 'UN', quantity: item.quantity ?? '', notes: item.notes || '' })
  const [saving, setSaving] = useState(false)
  const isLow = item.product_id && item.product_min_stock != null && parseFloat(form.quantity || 0) < parseFloat(item.product_min_stock || 0) && parseFloat(item.product_min_stock || 0) > 0

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put(`/stock/lists/${item.list_id}/items/${item.id}`, {
        ...form,
        quantity: form.quantity !== '' ? parseFloat(form.quantity) : null
      })
      onUpdate(data.item)
      setEditing(false)
    } catch {
      toast.error('Erro ao salvar item')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <tr className="bg-dark-700/30">
        <td className="px-4 py-3">
          <input className="w-full bg-dark-700 border border-primary-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none uppercase"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })} />
        </td>
        <td className="px-3 py-3">
          <select className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
            value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </td>
        <td className="px-3 py-3">
          <input type="number" min="0" step="0.001"
            className="w-full bg-dark-700 border border-primary-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none text-right"
            value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} autoFocus />
        </td>
        <td className="px-3 py-3">
          <input className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Obs..." />
        </td>
        <td className="px-3 py-3">
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"><Save className="w-4 h-4" /></button>
            <button onClick={() => setEditing(false)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-dark-700/20 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">{item.name}</span>
          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" title={`Abaixo do mínimo (${parseFloat(item.product_min_stock).toLocaleString('pt-BR')} ${item.unit})`} />}
        </div>
      </td>
      <td className="px-3 py-3 text-center text-dark-300 text-sm">{item.unit}</td>
      <td className="px-3 py-3 text-right">
        <span className={`font-mono font-semibold text-sm ${item.quantity === null || item.quantity === undefined ? 'text-dark-500 italic' : isLow ? 'text-amber-400' : 'text-white'}`}>
          {item.quantity !== null && item.quantity !== undefined ? parseFloat(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) : '—'}
        </span>
      </td>
      <td className="px-3 py-3 text-dark-400 text-sm">{item.notes}</td>
      <td className="px-3 py-3">
        {!finalized && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function StockListEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = async () => {
    try {
      const [listRes, productsRes] = await Promise.all([
        api.get(`/stock/lists/${id}`),
        api.get('/stock/products')
      ])
      setList(listRes.data)
      setItems(listRes.data.items || [])
      setProducts(productsRes.data)
    } catch {
      toast.error('Erro ao carregar lista')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`/stock/lists/${id}/items/${itemId}`)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch {
      toast.error('Erro ao remover item')
    }
  }

  const handleFinalize = async () => {
    if (!confirm(`Finalizar "${list.name}"?\n\nOs estoques dos produtos cadastrados serão atualizados. Esta ação não pode ser desfeita.`)) return
    setFinalizing(true)
    try {
      await api.post(`/stock/lists/${id}/finalize`)
      toast.success('Lista finalizada! Estoques atualizados.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao finalizar lista')
    } finally {
      setFinalizing(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get(`/stock/lists/${id}/export-txt`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/plain;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `estoque-${list.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erro ao exportar')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-dark-400">Carregando...</div>
  if (!list) return <div className="py-20 text-center text-dark-400">Lista não encontrada</div>

  const finalized = list.status === 'finalizada'
  const itemsWithQty = items.filter(i => i.quantity !== null && i.quantity !== undefined)
  const progress = items.length > 0 ? Math.round((itemsWithQty.length / items.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/estoque/listas')} className="mt-1 p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-dark-400 uppercase tracking-wider">{TYPE_LABELS[list.type]}</span>
            {finalized && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Finalizada
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white truncate">{list.name}</h1>
          {list.notes && <p className="text-dark-400 text-sm mt-0.5">{list.notes}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 rounded-xl text-sm transition-colors">
            <Download className="w-4 h-4" /> {exporting ? 'Exportando...' : 'Exportar TXT'}
          </button>
          {!finalized && items.length > 0 && (
            <button onClick={() => navigate(`/estoque/listas/${id}/executar`)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm">
              <ClipboardCheck className="w-4 h-4" /> Iniciar Contagem
            </button>
          )}
          {!finalized && (
            <button onClick={handleFinalize} disabled={finalizing || items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm">
              <CheckCircle className="w-4 h-4" /> {finalizing ? 'Finalizando...' : 'Finalizar Lista'}
            </button>
          )}
        </div>
      </div>

      {/* Progresso */}
      {!finalized && items.length > 0 && (
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-dark-400">Itens com quantidade preenchida</span>
            <span className="text-white font-medium">{itemsWithQty.length} / {items.length}</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-primary-500 to-accent-teal h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Tabela de itens */}
      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <h2 className="text-sm font-semibold text-white">{items.length} {items.length === 1 ? 'item' : 'itens'}</h2>
          {finalized && list.finalized_at && (
            <span className="text-xs text-dark-400">
              Finalizada em {new Date(list.finalized_at).toLocaleDateString('pt-BR')} às {new Date(list.finalized_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-10 h-10 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Nenhum item na lista</p>
            <p className="text-dark-500 text-xs mt-1">Use o formulário abaixo para adicionar produtos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Produto</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-400 uppercase">Unid.</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-dark-400 uppercase">Quantidade</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-dark-400 uppercase">Observação</th>
                  <th className="px-3 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    finalized={finalized}
                    onUpdate={(updated) => setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i))}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adicionar item */}
      {!finalized && (
        <AddItemRow
          listId={id}
          products={products}
          onAdded={(item) => setItems(prev => [...prev, item])}
        />
      )}
    </div>
  )
}
