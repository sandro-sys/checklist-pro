import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, Package, X, Check, Search, Download, CheckSquare, Square, Copy } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { RESTAURANT_PRODUCTS, TOTAL_PRODUCTS, BAKERY_PRODUCTS, TOTAL_BAKERY_PRODUCTS, PRODUCT_CATEGORIES } from '../data/restaurantProducts'

const UNITS = ['UN', 'KG', 'G', 'L', 'ML', 'CX', 'SC', 'PC', 'DZ', 'MT']

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    unit: product?.unit || 'UN',
    category: product?.category || 'Outros',
    min_stock: product?.min_stock ?? 0,
    has_flavor: product?.has_flavor ? true : false
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nome obrigatório')
    setSaving(true)
    try {
      if (product) {
        await api.put(`/stock/products/${product.id}`, form)
        toast.success('Produto atualizado')
      } else {
        await api.post('/stock/products', form)
        toast.success('Produto criado')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-lg font-bold text-white">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Nome <span className="text-dark-500 text-xs">(salvo em CAIXA ALTA)</span></label>
            <input
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 uppercase"
              placeholder="Ex: FARINHA DE TRIGO"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Categoria</label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Unidade</label>
              <select
                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Estoque Mínimo</label>
              <input
                type="number" min="0" step="0.001"
                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                value={form.min_stock}
                onChange={e => setForm({ ...form, min_stock: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setForm({ ...form, has_flavor: !form.has_flavor })}
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${form.has_flavor ? 'bg-primary-500' : 'bg-dark-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.has_flavor ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-dark-300 group-hover:text-white transition-colors">
                Requer informação de sabor
                <span className="block text-xs text-dark-500">Operador poderá indicar o sabor ao preencher a lista</span>
              </span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark-600 text-dark-300 hover:text-white hover:border-dark-500 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MovementModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({ type: 'entrada', quantity: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.quantity || parseFloat(form.quantity) <= 0) return toast.error('Informe uma quantidade válida')
    setSaving(true)
    try {
      await api.post('/stock/movements', { product_id: product.id, ...form, quantity: parseFloat(form.quantity) })
      toast.success('Movimento registrado')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao registrar movimento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-lg font-bold text-white">Lançar Movimento</h2>
            <p className="text-sm text-dark-400 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {['entrada', 'saida', 'ajuste'].map(t => (
              <button key={t} type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${form.type === t
                  ? t === 'entrada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : t === 'saida'   ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-dark-700 text-dark-400 hover:text-white border border-dark-600'}`}>
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Quantidade ({product.unit}) — Saldo atual: <span className="text-primary-400">{parseFloat(product.current_stock).toLocaleString('pt-BR')}</span>
            </label>
            <input
              type="number" min="0" step="0.001" required
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              placeholder="0,000"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Motivo <span className="text-dark-500 text-xs">(opcional)</span></label>
            <input
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              placeholder="Ex: Compra semanal, Quebra, etc."
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark-600 text-dark-300 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {saving ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImportModal({ catalog, title, existingNames, onClose, onDone }) {
  const [selected, setSelected] = useState(() => {
    const init = {}
    catalog.forEach(g => g.items.forEach(item => { init[item.name] = true }))
    return init
  })
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(null)

  const toggleItem = (name) => setSelected(prev => ({ ...prev, [name]: !prev[name] }))
  const toggleGroup = (group) => {
    const names = group.items.map(i => i.name)
    const allOn = names.every(n => selected[n])
    setSelected(prev => { const s = { ...prev }; names.forEach(n => s[n] = !allOn); return s })
  }

  const toImport = catalog.flatMap(g => g.items).filter(i => selected[i.name] && !existingNames.has(i.name))
  const alreadyExist = catalog.flatMap(g => g.items).filter(i => selected[i.name] && existingNames.has(i.name))
  const totalProducts = catalog.reduce((acc, g) => acc + g.items.length, 0)

  const handleImport = async () => {
    if (toImport.length === 0) return toast.error('Nenhum produto novo para importar')
    setImporting(true)
    let ok = 0, fail = 0
    for (let i = 0; i < toImport.length; i++) {
      setProgress({ current: i + 1, total: toImport.length, name: toImport[i].name })
      try {
        await api.post('/stock/products', toImport[i])
        ok++
      } catch {
        fail++
      }
    }
    setImporting(false)
    setProgress(null)
    if (ok > 0) toast.success(`${ok} produto(s) importado(s) com sucesso!`)
    if (fail > 0) toast.error(`${fail} produto(s) falharam`)
    onDone()
  }

  const newCount = toImport.length

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-dark-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-sm text-dark-400 mt-1">
              {totalProducts} produtos em {catalog.length} grupos —
              <span className="text-primary-400 ml-1">{newCount} novos para importar</span>
              {alreadyExist.length > 0 && <span className="text-dark-500 ml-1">({alreadyExist.length} já cadastrados)</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white rounded-lg flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {catalog.map(group => {
            const allOn = group.items.every(i => selected[i.name])
            const someOn = group.items.some(i => selected[i.name])
            return (
              <div key={group.group}>
                <button onClick={() => toggleGroup(group)}
                  className="flex items-center gap-2 mb-2 w-full text-left group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${allOn ? 'bg-primary-500 border-primary-500' : someOn ? 'bg-primary-500/40 border-primary-500/40' : 'border-dark-500'}`}>
                    {(allOn || someOn) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">{group.group}</span>
                  <span className="text-xs text-dark-500">({group.items.length} produtos)</span>
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
                  {group.items.map(item => {
                    const exists = existingNames.has(item.name)
                    return (
                      <button key={item.name} onClick={() => !exists && toggleItem(item.name)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${exists ? 'opacity-40 cursor-not-allowed' : 'hover:bg-dark-700'}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected[item.name] && !exists ? 'bg-primary-500 border-primary-500' : 'border-dark-600'}`}>
                          {selected[item.name] && !exists && <Check className="w-3 h-3 text-white" />}
                          {exists && <Check className="w-3 h-3 text-dark-400" />}
                        </div>
                        <span className="text-sm text-dark-200 flex-1">{item.name}</span>
                        {item.has_flavor && <span className="text-xs text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">sabor</span>}
                        <span className="text-xs text-dark-500">{item.unit}</span>
                        {exists && <span className="text-xs text-dark-500 italic">existente</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {importing && progress && (
          <div className="px-6 py-3 border-t border-dark-700 flex-shrink-0">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-dark-400 truncate">{progress.name}</span>
              <span className="text-white font-medium ml-3">{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-primary-500 to-accent-teal h-1.5 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-3 p-6 border-t border-dark-700 flex-shrink-0">
          <button onClick={onClose} disabled={importing}
            className="flex-1 py-3 rounded-xl border border-dark-600 text-dark-300 hover:text-white transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleImport} disabled={importing || newCount === 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            {importing ? 'Importando...' : `Importar ${newCount} produto${newCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StockProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalProduct, setModalProduct] = useState(undefined)
  const [movProduct, setMovProduct] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [showImport, setShowImport] = useState(null) // null | 'restaurant' | 'bakery'
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/stock/products', { params: { include_inactive: showInactive ? '1' : undefined } })
      setProducts(data)
    } catch {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showInactive])

  const handleCopyProduct = async (product) => {
    try {
      await api.post(`/stock/products/${product.id}/copy`)
      toast.success(`"${product.name}" copiado`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao copiar produto')
    }
  }

  const handleDeactivate = async (product) => {
    if (!confirm(`Desativar "${product.name}"?`)) return
    try {
      await api.delete(`/stock/products/${product.id}`)
      toast.success('Produto desativado')
      load()
    } catch {
      toast.error('Erro ao desativar produto')
    }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.size
    if (!confirm(`Desativar ${count} produto(s) selecionado(s)?`)) return
    setBulkDeleting(true)
    let ok = 0, fail = 0
    for (const id of selectedIds) {
      try {
        await api.delete(`/stock/products/${id}`)
        ok++
      } catch {
        fail++
      }
    }
    setBulkDeleting(false)
    setSelectedIds(new Set())
    if (ok > 0) toast.success(`${ok} produto(s) desativado(s)`)
    if (fail > 0) toast.error(`${fail} produto(s) com erro`)
    load()
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const activeFiltered = filtered.filter(p => p.is_active)
    if (activeFiltered.every(p => selectedIds.has(p.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(activeFiltered.map(p => p.id)))
    }
  }

  const filtered = products.filter(p =>
    (p.name.includes(search.toUpperCase()) || (p.unit || '').includes(search.toUpperCase())) &&
    (!filterCategory || p.category === filterCategory)
  )
  const belowMin = products.filter(p => p.is_active && parseFloat(p.current_stock) < parseFloat(p.min_stock) && parseFloat(p.min_stock) > 0)
  const activeFiltered = filtered.filter(p => p.is_active)
  const allActiveSelected = activeFiltered.length > 0 && activeFiltered.every(p => selectedIds.has(p.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos / Ingredientes</h1>
          <p className="text-dark-400 text-sm mt-1">{products.filter(p => p.is_active).length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport('bakery')} className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 rounded-xl transition-all text-sm">
            <Download className="w-4 h-4" /> Importar Confeitaria
          </button>
          <button onClick={() => setShowImport('restaurant')} className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 rounded-xl transition-all text-sm">
            <Download className="w-4 h-4" /> Importar Restaurante
          </button>
          <button onClick={() => setModalProduct(null)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all">
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {belowMin.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" /> {belowMin.length} produto(s) abaixo do estoque mínimo
          </div>
          <div className="flex flex-wrap gap-2">
            {belowMin.map(p => (
              <span key={p.id} className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg">
                {p.name} ({parseFloat(p.current_stock).toLocaleString('pt-BR')} / mín {parseFloat(p.min_stock).toLocaleString('pt-BR')} {p.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 text-sm uppercase"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
          />
        </div>
        <select
          className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Ver inativos
        </label>
      </div>

      {/* Barra de ação em massa */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
          <span className="text-sm text-rose-300 font-medium">
            {selectedIds.size} produto(s) selecionado(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-dark-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-dark-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 text-xs px-3 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg transition-colors disabled:opacity-50 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {bulkDeleting ? 'Desativando...' : 'Desativar selecionados'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-dark-400 hover:text-white transition-colors">
                    {allActiveSelected
                      ? <CheckSquare className="w-4 h-4 text-primary-400" />
                      : <Square className="w-4 h-4" />
                    }
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Produto</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider hidden md:table-cell">Categoria</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Unid.</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Saldo Atual</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Mínimo</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-dark-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center">
                  <Package className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">Nenhum produto encontrado</p>
                  <button onClick={() => setModalProduct(null)} className="mt-3 text-primary-400 hover:text-primary-300 text-sm">+ Cadastrar produto</button>
                </td></tr>
              ) : filtered.map(p => {
                const isLow = p.is_active && parseFloat(p.min_stock) > 0 && parseFloat(p.current_stock) < parseFloat(p.min_stock)
                return (
                  <tr key={p.id} className={`hover:bg-dark-700/30 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4 w-10">
                      {p.is_active && (
                        <button onClick={() => toggleSelect(p.id)} className="text-dark-400 hover:text-primary-400 transition-colors">
                          {selectedIds.has(p.id)
                            ? <CheckSquare className="w-4 h-4 text-primary-400" />
                            : <Square className="w-4 h-4" />
                          }
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{p.name}</span>
                        {isLow && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded-full bg-dark-700 text-dark-300">{p.category || 'Outros'}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-dark-300 text-sm">{p.unit}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-mono font-semibold ${isLow ? 'text-amber-400' : 'text-white'}`}>
                        {parseFloat(p.current_stock).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-dark-400 font-mono text-sm">
                      {parseFloat(p.min_stock) > 0 ? parseFloat(p.min_stock).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) : '—'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-700 text-dark-400'}`}>
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        {p.is_active && (
                          <>
                            <button onClick={() => setMovProduct(p)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Lançar movimento">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleCopyProduct(p)} className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Copiar produto">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={() => setModalProduct(p)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeactivate(p)} className="p-1.5 text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalProduct !== undefined && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(undefined)} onSave={() => { setModalProduct(undefined); load() }} />
      )}
      {movProduct && (
        <MovementModal product={movProduct} onClose={() => setMovProduct(null)} onSave={() => { setMovProduct(null); load() }} />
      )}
      {showImport === 'restaurant' && (
        <ImportModal
          catalog={RESTAURANT_PRODUCTS}
          title="Importar Lista Padrão de Restaurante"
          existingNames={new Set(products.map(p => p.name))}
          onClose={() => setShowImport(null)}
          onDone={() => { setShowImport(null); load() }}
        />
      )}
      {showImport === 'bakery' && (
        <ImportModal
          catalog={BAKERY_PRODUCTS}
          title="Importar Produtos — Confeitaria e Salgados"
          existingNames={new Set(products.map(p => p.name))}
          onClose={() => setShowImport(null)}
          onDone={() => { setShowImport(null); load() }}
        />
      )}
    </div>
  )
}
