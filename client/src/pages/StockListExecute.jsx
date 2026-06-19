import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Package, Settings, CheckCircle, Sparkles, CopyPlus } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_LABELS = { contagem: 'Contagem de Estoque', compras: 'Lista de Compras', inventario: 'Inventário' }

function ItemCard({ item, onSave, onDuplicate }) {
  const [quantity, setQuantity] = useState(
    item.quantity !== null && item.quantity !== undefined ? String(parseInt(item.quantity)) : ''
  )
  const [flavor, setFlavor] = useState(item.flavor || '')
  const [notes, setNotes] = useState(item.notes || '')
  const [saving, setSaving] = useState(false)
  const lastQty = useRef(item.quantity)
  const lastFlavor = useRef(item.flavor || '')
  const lastNotes = useRef(item.notes || '')

  const filled = quantity !== ''

  const save = async ({ quantityOverride } = {}) => {
    const qty = quantityOverride !== undefined ? quantityOverride : (quantity !== '' ? parseInt(quantity) : null)
    const prevQty = lastQty.current !== null && lastQty.current !== undefined ? parseInt(lastQty.current) : null
    const changed = qty !== prevQty || flavor !== lastFlavor.current || notes !== lastNotes.current
    if (!changed) return

    setSaving(true)
    try {
      const { data } = await api.put(`/stock/lists/${item.list_id}/items/${item.id}`, {
        name: item.name,
        unit: item.unit,
        quantity: qty,
        flavor: flavor || undefined,
        notes: notes || undefined
      })
      lastQty.current = data.item.quantity
      lastFlavor.current = data.item.flavor || ''
      lastNotes.current = data.item.notes || ''
      onSave({ ...data.item, product_current_stock: item.product_current_stock, product_min_stock: item.product_min_stock, product_has_flavor: item.product_has_flavor })
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      filled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-dark-800/50 border-dark-700/50'
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          filled ? 'bg-emerald-500 text-white' : 'bg-dark-700 text-dark-400'
        }`}>
          {filled ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-base leading-snug ${filled ? 'text-emerald-400' : 'text-white'}`}>
              {item.name}
            </p>
            {item.product_has_flavor && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> sabor
              </span>
            )}
          </div>
          {item.product_id && item.product_current_stock !== null && item.product_current_stock !== undefined && (
            <p className="text-dark-400 text-xs mt-0.5">
              Estoque atual: {parseInt(item.product_current_stock).toLocaleString('pt-BR')} {item.unit}
            </p>
          )}
        </div>
      </div>

      {/* Quantidade */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            const v = Math.max(0, (parseInt(quantity) || 0) - 1)
            setQuantity(String(v))
            save({ quantityOverride: v })
          }}
          className={`w-12 h-14 flex-shrink-0 rounded-xl border text-2xl font-bold transition-colors select-none ${
            filled ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-dark-600 text-dark-400 hover:bg-dark-700 hover:text-white'
          }`}
        >−</button>
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          onBlur={() => save()}
          placeholder="0"
          className={`flex-1 text-center text-2xl font-bold py-3.5 rounded-xl border focus:outline-none transition-all ${
            filled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 focus:border-emerald-400'
              : 'bg-dark-700 border-dark-600 text-white focus:border-primary-500'
          }`}
        />
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            const v = (parseInt(quantity) || 0) + 1
            setQuantity(String(v))
            save({ quantityOverride: v })
          }}
          className={`w-12 h-14 flex-shrink-0 rounded-xl border text-2xl font-bold transition-colors select-none ${
            filled ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-dark-600 text-dark-400 hover:bg-dark-700 hover:text-white'
          }`}
        >+</button>
        <div className="text-dark-300 font-semibold text-sm w-10 text-center flex-shrink-0">
          {item.unit || 'UN'}
        </div>
      </div>

      {/* Sabor */}
      {item.product_has_flavor && (
        <div className="mb-2">
          <label className="block text-xs text-violet-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Sabor
          </label>
          <input
            type="text"
            className="w-full bg-dark-700 border border-violet-500/40 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-dark-500"
            placeholder="Ex: Chocolate, Morango..."
            value={flavor}
            onChange={e => setFlavor(e.target.value)}
            onBlur={save}
          />
        </div>
      )}

      {/* Observação */}
      <div>
        <label className="block text-xs text-dark-400 mb-1">Observação</label>
        <input
          type="text"
          className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 placeholder-dark-500"
          placeholder="Opcional..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={save}
        />
      </div>

      {item.product_has_flavor && (
        <button
          type="button"
          onClick={() => onDuplicate(item)}
          className="mt-3 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          <CopyPlus className="w-3.5 h-3.5" />
          Duplicar para outro sabor
        </button>
      )}

      {saving && <p className="text-xs text-dark-500 text-right mt-1.5">Salvando...</p>}
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

  const handleDuplicate = async (item) => {
    try {
      const { data } = await api.post(`/stock/lists/${id}/items`, {
        product_id: item.product_id || undefined,
        name: item.name,
        unit: item.unit,
      })
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === item.id)
        const next = [...prev]
        next.splice(idx + 1, 0, { ...data.item, product_has_flavor: item.product_has_flavor })
        return next
      })
      toast.success('Item duplicado — informe o novo sabor')
    } catch {
      toast.error('Erro ao duplicar item')
    }
  }

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
              onDuplicate={handleDuplicate}
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
