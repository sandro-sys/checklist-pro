import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Package, Settings, CheckCircle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_LABELS = { contagem: 'Contagem de Estoque', compras: 'Lista de Compras', inventario: 'Inventário' }

function ItemCard({ item, onSave }) {
  const [quantity, setQuantity] = useState(
    item.quantity !== null && item.quantity !== undefined ? String(parseFloat(item.quantity)) : ''
  )
  const [saving, setSaving] = useState(false)
  const lastSaved = useRef(item.quantity)

  const filled = quantity !== ''

  const handleBlur = async () => {
    const qty = quantity !== '' ? parseFloat(quantity) : null
    const prev = lastSaved.current !== null && lastSaved.current !== undefined
      ? parseFloat(lastSaved.current)
      : null

    // sem mudança — não chama a API
    if (qty === prev) return
    if (qty === null && prev === null) return

    setSaving(true)
    try {
      const { data } = await api.put(`/stock/lists/${item.list_id}/items/${item.id}`, {
        name: item.name,
        unit: item.unit,
        quantity: qty,
        notes: item.notes || undefined
      })
      lastSaved.current = data.item.quantity
      // preserva campos de produto que o PUT não devolve
      onSave({ ...data.item, product_current_stock: item.product_current_stock, product_min_stock: item.product_min_stock })
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      filled
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-dark-800/50 border-dark-700/50'
    }`}>
      {/* Nome e info */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          filled ? 'bg-emerald-500 text-white' : 'bg-dark-700 text-dark-400'
        }`}>
          {filled ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-base leading-snug ${filled ? 'text-emerald-400' : 'text-white'}`}>
            {item.name}
          </p>
          {item.product_id && item.product_current_stock !== null && item.product_current_stock !== undefined && (
            <p className="text-dark-400 text-xs mt-0.5">
              Estoque atual: {parseFloat(item.product_current_stock).toLocaleString('pt-BR')} {item.unit}
            </p>
          )}
          {item.notes && (
            <p className="text-dark-500 text-xs mt-0.5 italic">{item.notes}</p>
          )}
        </div>
      </div>

      {/* Input de quantidade */}
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          step="0.001"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className={`flex-1 text-center text-2xl font-bold py-4 rounded-xl border focus:outline-none transition-all ${
            filled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 focus:border-emerald-400'
              : 'bg-dark-700 border-dark-600 text-white focus:border-primary-500'
          }`}
        />
        <div className="text-dark-300 font-semibold text-sm w-10 text-center flex-shrink-0">
          {item.unit || 'UN'}
        </div>
      </div>

      {saving && (
        <p className="text-xs text-dark-500 text-right mt-1.5">Salvando...</p>
      )}
    </div>
  )
}

export default function StockListExecute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get(`/stock/lists/${id}`)
      setList(data)
      setItems(data.items || [])
    } catch {
      toast.error('Erro ao carregar lista')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleFinalize = async () => {
    if (!confirm(`Finalizar "${list.name}"?\n\nOs estoques dos produtos cadastrados serão atualizados. Esta ação não pode ser desfeita.`)) return
    setFinalizing(true)
    try {
      await api.post(`/stock/lists/${id}/finalize`)
      toast.success('Lista finalizada! Estoques atualizados.')
      navigate(`/estoque/listas/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao finalizar lista')
    } finally {
      setFinalizing(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-dark-400">Carregando...</div>
  if (!list) return <div className="py-20 text-center text-dark-400">Lista não encontrada</div>

  if (list.status === 'finalizada') {
    return (
      <div className="py-20 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Lista já finalizada</p>
        <button
          onClick={() => navigate(`/estoque/listas/${id}`)}
          className="text-primary-400 hover:text-primary-300 text-sm"
        >
          Ver detalhes →
        </button>
      </div>
    )
  }

  const filledItems = items.filter(i => i.quantity !== null && i.quantity !== undefined)
  const progress = items.length > 0 ? Math.round((filledItems.length / items.length) * 100) : 0
  const allFilled = items.length > 0 && filledItems.length === items.length

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-xl -mx-4 px-4 pt-3 pb-4 border-b border-dark-700/50 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(`/estoque/listas/${id}`)}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-dark-400 uppercase tracking-wider">{TYPE_LABELS[list.type] || list.type}</p>
            <h1 className="text-lg font-bold text-white truncate">{list.name}</h1>
          </div>
          <button
            onClick={() => navigate(`/estoque/listas/${id}`)}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-colors flex-shrink-0"
            title="Configurar lista"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-dark-400">Itens preenchidos</span>
            <span className={`font-semibold ${allFilled ? 'text-emerald-400' : 'text-white'}`}>
              {filledItems.length} / {items.length}
            </span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allFilled
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-primary-500 to-accent-teal'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de itens */}
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">Nenhum item na lista</p>
          <button
            onClick={() => navigate(`/estoque/listas/${id}`)}
            className="mt-3 text-primary-400 hover:text-primary-300 text-sm"
          >
            Adicionar itens →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onSave={(updated) =>
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
              }
            />
          ))}
        </div>
      )}

      {/* Botão finalizar */}
      {items.length > 0 && (
        <div className="pt-6 space-y-2">
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className={`w-full py-4 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 ${
              allFilled
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                : 'bg-dark-800 border border-dark-600 text-dark-300 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            {finalizing
              ? 'Finalizando...'
              : allFilled
              ? 'Finalizar e Atualizar Estoque'
              : `Finalizar (${filledItems.length}/${items.length} preenchidos)`}
          </button>
          {!allFilled && (
            <p className="text-center text-xs text-dark-500">
              Itens sem quantidade serão ignorados na finalização
            </p>
          )}
        </div>
      )}
    </div>
  )
}
