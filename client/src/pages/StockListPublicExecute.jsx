import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Circle, Package, CheckCircle, Sparkles } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_LABELS = { contagem: 'Contagem de Estoque', compras: 'Lista de Compras', inventario: 'Inventário' }

function ItemCard({ item, listId, onSave }) {
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

  const save = async (overrides = {}) => {
    const qty = overrides.quantity !== undefined ? overrides.quantity : (quantity !== '' ? parseInt(quantity) : null)
    const fl = overrides.flavor !== undefined ? overrides.flavor : flavor
    const nt = overrides.notes !== undefined ? overrides.notes : notes

    const qtyPrev = lastQty.current !== null && lastQty.current !== undefined ? parseInt(lastQty.current) : null
    const changed = qty !== qtyPrev || fl !== lastFlavor.current || nt !== lastNotes.current
    if (!changed) return

    setSaving(true)
    try {
      const { data } = await api.put(`/stock/public/${listId}/items/${item.id}`, {
        quantity: qty,
        flavor: fl,
        notes: nt
      })
      lastQty.current = data.item.quantity
      lastFlavor.current = data.item.flavor || ''
      lastNotes.current = data.item.notes || ''
      onSave({ ...data.item, product_has_flavor: item.product_has_flavor })
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
        </div>
      </div>

      {/* Quantidade */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          onBlur={() => save()}
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

      {/* Sabor (apenas para produtos com has_flavor) */}
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
            onBlur={() => save()}
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
          onBlur={() => save()}
        />
      </div>

      {saving && <p className="text-xs text-dark-500 text-right mt-1.5">Salvando...</p>}
    </div>
  )
}

export default function StockListPublicExecute() {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/stock/public/${id}`)
      .then(({ data }) => {
        setList(data)
        setItems(data.items || [])
      })
      .catch(() => setError('Lista não encontrada ou indisponível.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-dark-400">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Lista não encontrada</p>
          <p className="text-dark-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (list.status === 'finalizada') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Lista já finalizada</p>
          <p className="text-dark-400 text-sm">Esta lista de contagem foi encerrada.</p>
        </div>
      </div>
    )
  }

  const filledItems = items.filter(i => i.quantity !== null && i.quantity !== undefined)
  const progress = items.length > 0 ? Math.round((filledItems.length / items.length) * 100) : 0
  const allFilled = items.length > 0 && filledItems.length === items.length

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="mb-2">
            {list.company_name && (
              <p className="text-xs text-dark-500 uppercase tracking-wider">{list.company_name}</p>
            )}
            <p className="text-xs text-dark-400 uppercase tracking-wider">{TYPE_LABELS[list.type] || list.type}</p>
            <h1 className="text-lg font-bold text-white truncate">{list.name}</h1>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-dark-400">Itens preenchidos</span>
              <span className={`font-semibold ${allFilled ? 'text-emerald-400' : 'text-white'}`}>
                {filledItems.length} / {items.length}
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allFilled ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-500 to-accent-teal'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de itens */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-12">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Nenhum item na lista</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                listId={id}
                onSave={(updated) =>
                  setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
                }
              />
            ))}
          </div>
        )}

        {allFilled && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-semibold">Contagem concluída!</p>
            <p className="text-dark-400 text-sm mt-1">Todos os itens foram preenchidos. O gestor irá finalizar a lista.</p>
          </div>
        )}

        <p className="text-center text-xs text-dark-600 mt-8">CheckList Pro</p>
      </div>
    </div>
  )
}
