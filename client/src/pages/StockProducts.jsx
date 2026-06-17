import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, Package, X, Check, Search } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const UNITS = ['UN', 'KG', 'G', 'L', 'ML', 'CX', 'SC', 'PC', 'DZ', 'MT']

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    unit: product?.unit || 'UN',
    min_stock: product?.min_stock ?? 0
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

export default function StockProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalProduct, setModalProduct] = useState(undefined)
  const [movProduct, setMovProduct] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

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

  const filtered = products.filter(p => p.name.includes(search.toUpperCase()) || (p.unit || '').includes(search.toUpperCase()))
  const belowMin = products.filter(p => p.is_active && parseFloat(p.current_stock) < parseFloat(p.min_stock) && parseFloat(p.min_stock) > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos / Ingredientes</h1>
          <p className="text-dark-400 text-sm mt-1">{products.filter(p => p.is_active).length} produtos cadastrados</p>
        </div>
        <button onClick={() => setModalProduct(null)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all">
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 text-sm uppercase"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Ver inativos
        </label>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Produto</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Unid.</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Saldo Atual</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Mínimo</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-dark-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center">
                  <Package className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">Nenhum produto encontrado</p>
                  <button onClick={() => setModalProduct(null)} className="mt-3 text-primary-400 hover:text-primary-300 text-sm">+ Cadastrar produto</button>
                </td></tr>
              ) : filtered.map(p => {
                const isLow = p.is_active && parseFloat(p.min_stock) > 0 && parseFloat(p.current_stock) < parseFloat(p.min_stock)
                return (
                  <tr key={p.id} className={`hover:bg-dark-700/30 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{p.name}</span>
                        {isLow && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      </div>
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
    </div>
  )
}
