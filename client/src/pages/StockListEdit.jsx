import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Download, CheckCircle, AlertTriangle, Search, Package, Edit2, Save, X, ClipboardCheck, User, Sparkles, ListPlus, Check, Share2, Copy, ExternalLink, QrCode } from 'lucide-react'
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
  const [flavor, setFlavor] = useState('')
  const [productId, setProductId] = useState(null)
  const [hasFlavor, setHasFlavor] = useState(false)
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
    setHasFlavor(!!p.has_flavor)
    setShowSuggestions(false)
    setTimeout(() => document.getElementById('qty-input')?.focus(), 50)
  }

  const handleSearchChange = (val) => {
    setSearch(val.toUpperCase())
    setName(val.toUpperCase())
    setProductId(null)
    setHasFlavor(false)
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
        notes: notes || undefined,
        flavor: flavor || undefined
      })
      onAdded(data.item)
      setSearch(''); setName(''); setUnit('UN'); setQuantity(''); setNotes(''); setFlavor(''); setProductId(null); setHasFlavor(false)
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
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{p.name}</span>
                  {p.has_flavor && <Sparkles className="w-3 h-3 text-violet-400" />}
                </div>
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
          <input id="qty-input" type="number" min="0" step="1" inputMode="numeric"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>
        {hasFlavor ? (
          <>
            <div>
              <label className="block text-xs text-violet-400 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Sabor</label>
              <input className="w-full bg-dark-700 border border-violet-500/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="Ex: Chocolate..." value={flavor} onChange={e => setFlavor(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Observação</label>
              <input className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                placeholder="Opcional..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <label className="block text-xs text-dark-400 mb-1">Observação</label>
            <input className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              placeholder="Opcional..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        )}
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
  const [form, setForm] = useState({ name: item.name, unit: item.unit || 'UN', quantity: item.quantity ?? '', notes: item.notes || '', flavor: item.flavor || '' })
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
          <input type="number" min="0" step="1" inputMode="numeric"
            className="w-full bg-dark-700 border border-primary-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none text-right"
            value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} autoFocus />
        </td>
        <td className="px-3 py-3">
          {item.product_has_flavor ? (
            <div className="space-y-1">
              <input className="w-full bg-dark-700 border border-violet-500/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500"
                value={form.flavor} onChange={e => setForm({ ...form, flavor: e.target.value })} placeholder="Sabor..." />
              <input className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Obs..." />
            </div>
          ) : (
            <input className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Obs..." />
          )}
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white text-sm">{item.name}</span>
          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" title={`Abaixo do mínimo (${parseFloat(item.product_min_stock).toLocaleString('pt-BR')} ${item.unit})`} />}
          {item.flavor && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />{item.flavor}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-center text-dark-300 text-sm">{item.unit}</td>
      <td className="px-3 py-3 text-right">
        <span className={`font-mono font-semibold text-sm ${item.quantity === null || item.quantity === undefined ? 'text-dark-500 italic' : isLow ? 'text-amber-400' : 'text-white'}`}>
          {item.quantity !== null && item.quantity !== undefined ? parseInt(item.quantity).toLocaleString('pt-BR') : '—'}
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

function ShareModal({ listId, listName, onClose }) {
  const shareUrl = `${window.location.origin}/contar/${listId}`
  const [qrCode, setQrCode] = useState(null)
  const [loadingQr, setLoadingQr] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get(`/qrcode/stock/${listId}`)
      .then(({ data }) => setQrCode(data.qr_code))
      .catch(() => {})
      .finally(() => setLoadingQr(false))
  }, [listId])

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiado!')
  }

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Olá! Por favor, preencha a contagem de estoque "${listName}":\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-bold text-white">Compartilhar Lista</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-dark-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* QR Code */}
          <div className="bg-white rounded-xl p-3 flex items-center justify-center min-h-[200px]">
            {loadingQr ? (
              <div className="text-dark-400 text-sm">Gerando QR Code...</div>
            ) : qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-full max-w-[180px] aspect-square" />
            ) : (
              <div className="text-dark-400 text-sm text-center">
                <QrCode className="w-10 h-10 mx-auto mb-2 text-dark-300" />
                QR Code indisponível
              </div>
            )}
          </div>

          {/* Link */}
          <div className="bg-dark-700 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-dark-300 text-xs flex-1 truncate">{shareUrl}</span>
          </div>

          {/* Botões */}
          <div className="space-y-2">
            <button
              onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pelo WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-white text-sm transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-white text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir em nova aba
            </a>
          </div>

          <p className="text-xs text-dark-500 text-center">
            O colaborador pode preencher a contagem sem precisar fazer login.
          </p>
        </div>
      </div>
    </div>
  )
}

function BulkAddModal({ listId, products, existingNames, onClose, onDone }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [adding, setAdding] = useState(false)
  const [progress, setProgress] = useState(null)

  const available = products.filter(p =>
    !existingNames.has(p.name) &&
    (search === '' || p.name.includes(search.toUpperCase()))
  )

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => {
    if (available.every(p => selected.has(p.id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(available.map(p => p.id)))
    }
  }

  const handleAdd = async () => {
    const toAdd = products.filter(p => selected.has(p.id))
    if (toAdd.length === 0) return
    setAdding(true)
    let ok = 0
    for (let i = 0; i < toAdd.length; i++) {
      setProgress({ current: i + 1, total: toAdd.length, name: toAdd[i].name })
      try {
        await api.post(`/stock/lists/${listId}/items`, {
          product_id: toAdd[i].id,
          name: toAdd[i].name,
          unit: toAdd[i].unit,
        })
        ok++
      } catch { /* skip */ }
    }
    setAdding(false)
    setProgress(null)
    toast.success(`${ok} produto(s) adicionado(s) à lista`)
    onDone()
  }

  const allVisibleSelected = available.length > 0 && available.every(p => selected.has(p.id))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between p-5 border-b border-dark-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Adicionar Produtos em Massa</h2>
            <p className="text-xs text-dark-400 mt-0.5">{selected.size} selecionado(s) — {products.filter(p => existingNames.has(p.name)).length} já na lista</p>
          </div>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 border-b border-dark-700 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 text-sm uppercase"
              placeholder="Filtrar produtos..."
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <button onClick={toggleAll} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700/50 text-left border-b border-dark-700/50 transition-colors">
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${allVisibleSelected ? 'bg-primary-500 border-primary-500' : 'border-dark-500'}`}>
              {allVisibleSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Selecionar todos visíveis ({available.length})</span>
          </button>

          {available.length === 0 ? (
            <div className="py-10 text-center text-dark-400 text-sm">
              {search ? 'Nenhum produto encontrado' : 'Todos os produtos já estão na lista'}
            </div>
          ) : (
            available.map(p => (
              <button key={p.id} onClick={() => toggle(p.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700/40 text-left transition-colors border-b border-dark-700/20 last:border-0">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected.has(p.id) ? 'bg-primary-500 border-primary-500' : 'border-dark-600'}`}>
                  {selected.has(p.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-white flex-1">{p.name}</span>
                {p.has_flavor && <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" title="Requer sabor" />}
                <span className="text-xs text-dark-500 flex-shrink-0">{p.unit}</span>
              </button>
            ))
          )}
        </div>

        {adding && progress && (
          <div className="px-5 py-3 border-t border-dark-700 flex-shrink-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-dark-400 truncate">{progress.name}</span>
              <span className="text-white font-medium ml-3">{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-primary-500 to-accent-teal h-1.5 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-3 p-5 border-t border-dark-700 flex-shrink-0">
          <button onClick={onClose} disabled={adding} className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 hover:text-white transition-colors disabled:opacity-50 text-sm">
            Cancelar
          </button>
          <button onClick={handleAdd} disabled={adding || selected.size === 0}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <ListPlus className="w-4 h-4" />
            {adding ? 'Adicionando...' : `Adicionar ${selected.size} produto${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StockListEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const load = async () => {
    try {
      const [listRes, productsRes, usersRes] = await Promise.all([
        api.get(`/stock/lists/${id}`),
        api.get('/stock/products'),
        api.get('/users')
      ])
      setList(listRes.data)
      setItems(listRes.data.items || [])
      setProducts(productsRes.data)
      setUsers(usersRes.data.filter(u => u.is_active))
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

  const handleAssign = async (assignedTo) => {
    try {
      await api.put(`/stock/lists/${id}`, { assigned_to: assignedTo || null })
      setList(prev => ({
        ...prev,
        assigned_to: assignedTo || null,
        assigned_to_name: users.find(u => u.id === assignedTo)?.name || null
      }))
      toast.success(assignedTo ? 'Lista atribuída' : 'Atribuição removida')
    } catch {
      toast.error('Erro ao salvar atribuição')
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
          {/* Atribuição */}
          {!finalized && users.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <User className="w-3.5 h-3.5 text-dark-500 flex-shrink-0" />
              <select
                value={list.assigned_to || ''}
                onChange={e => handleAssign(e.target.value)}
                className="text-xs bg-dark-700 border border-dark-600 rounded-lg px-2 py-1 text-dark-300 focus:outline-none focus:border-primary-500 focus:text-white transition-colors"
              >
                <option value="">— Sem atribuição —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
          {finalized && list.assigned_to_name && (
            <div className="flex items-center gap-1.5 mt-2">
              <User className="w-3.5 h-3.5 text-dark-500" />
              <span className="text-xs text-dark-400">{list.assigned_to_name}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 rounded-xl text-sm transition-colors">
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
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
          {finalized && list.finalized_at ? (
            <span className="text-xs text-dark-400">
              Finalizada em {new Date(list.finalized_at).toLocaleDateString('pt-BR')} às {new Date(list.finalized_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : !finalized && (
            <button onClick={() => setShowBulkAdd(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-lg text-xs font-semibold hover:bg-primary-500/20 transition-colors">
              <ListPlus className="w-3.5 h-3.5" /> Adicionar em massa
            </button>
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
                  <th className="text-left px-3 py-3 text-xs font-semibold text-dark-400 uppercase">Sabor / Obs.</th>
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

      {showBulkAdd && (
        <BulkAddModal
          listId={id}
          products={products}
          existingNames={new Set(items.map(i => i.name))}
          onClose={() => setShowBulkAdd(false)}
          onDone={() => { setShowBulkAdd(false); load() }}
        />
      )}

      {showShare && (
        <ShareModal
          listId={id}
          listName={list.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
