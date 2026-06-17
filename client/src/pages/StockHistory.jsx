import { useState, useEffect } from 'react'
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Filter, Package } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  entrada: { icon: ArrowUpCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Entrada' },
  saida:   { icon: ArrowDownCircle, color: 'text-rose-400',    bg: 'bg-rose-500/10',    label: 'Saída' },
  ajuste:  { icon: RefreshCw,       color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Ajuste' }
}

export default function StockHistory() {
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ product_id: '', type: '' })

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.product_id) params.product_id = filters.product_id
      if (filters.type) params.type = filters.type
      const { data } = await api.get('/stock/movements', { params })
      setMovements(data)
    } catch {
      toast.error('Erro ao carregar movimentos')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/stock/products')
      setProducts(data)
    } catch {}
  }

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { load() }, [filters])

  const fmtQty = (v, type) => {
    const n = parseFloat(v)
    const sign = type === 'saida' ? '-' : type === 'entrada' ? '+' : '±'
    return `${sign}${Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Histórico de Movimentos</h1>
        <p className="text-dark-400 text-sm mt-1">{movements.length} movimento(s) encontrado(s)</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-dark-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filtros:</span>
        </div>
        <select
          className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
          value={filters.product_id}
          onChange={e => setFilters({ ...filters, product_id: e.target.value })}
        >
          <option value="">Todos os produtos</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="ajuste">Ajuste</option>
        </select>
        {(filters.product_id || filters.type) && (
          <button onClick={() => setFilters({ product_id: '', type: '' })} className="text-sm text-dark-400 hover:text-white transition-colors">
            Limpar filtros
          </button>
        )}
      </div>

      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Produto</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Quantidade</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Anterior</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Novo Saldo</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-dark-400">Carregando...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <Package className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">Nenhum movimento encontrado</p>
                </td></tr>
              ) : movements.map(m => {
                const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.ajuste
                const Icon = cfg.icon
                const dt = new Date(m.created_at)
                return (
                  <tr key={m.id} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="text-white text-sm">{dt.toLocaleDateString('pt-BR')}</div>
                      <div className="text-dark-500 text-xs">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-white text-sm font-medium">{m.product_name}</div>
                      <div className="text-dark-500 text-xs">{m.product_unit}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-mono font-semibold text-sm ${cfg.color}`}>
                        {fmtQty(m.quantity, m.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-dark-400 font-mono text-sm">
                      {parseFloat(m.previous_stock).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-sm text-white">
                      {parseFloat(m.new_stock).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-dark-400 text-sm truncate max-w-[180px]">{m.reason || '—'}</div>
                      {m.user_name && <div className="text-dark-500 text-xs">{m.user_name}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
