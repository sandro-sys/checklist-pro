import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Circle, Package, CheckCircle, Sparkles, Share2, Clock } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TYPE_LABELS = { contagem: 'Contagem de Estoque', compras: 'Lista de Compras', inventario: 'Inventário' }

function ItemCard({ item, listId, onSave, disabled }) {
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
    if (disabled) return
    const qty = quantityOverride !== undefined ? quantityOverride : (quantity !== '' ? parseInt(quantity) : null)
    const prevQty = lastQty.current !== null && lastQty.current !== undefined ? parseInt(lastQty.current) : null
    const changed = qty !== prevQty || flavor !== lastFlavor.current || notes !== lastNotes.current
    if (!changed) return

    setSaving(true)
    try {
      const { data } = await api.put(`/stock/lists/${listId}/items/${item.id}`, {
        name: item.name,
        unit: item.unit,
        quantity: qty,
        flavor: flavor || undefined,
        notes: notes || undefined
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
      disabled ? 'opacity-60' : ''
    } ${filled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-dark-800/50 border-dark-700/50'}`}>
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

      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            const v = Math.max(0, (parseInt(quantity) || 0) - 1)
            setQuantity(String(v))
            save({ quantityOverride: v })
          }}
          className={`w-12 h-14 flex-shrink-0 rounded-xl border text-2xl font-bold transition-colors disabled:cursor-not-allowed select-none ${
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
          disabled={disabled}
          className={`flex-1 text-center text-2xl font-bold py-3.5 rounded-xl border focus:outline-none transition-all disabled:cursor-not-allowed ${
            filled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 focus:border-emerald-400'
              : 'bg-dark-700 border-dark-600 text-white focus:border-primary-500'
          }`}
        />
        <button
          type="button"
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            const v = (parseInt(quantity) || 0) + 1
            setQuantity(String(v))
            save({ quantityOverride: v })
          }}
          className={`w-12 h-14 flex-shrink-0 rounded-xl border text-2xl font-bold transition-colors disabled:cursor-not-allowed select-none ${
            filled ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-dark-600 text-dark-400 hover:bg-dark-700 hover:text-white'
          }`}
        >+</button>
        <div className="text-dark-300 font-semibold text-sm w-10 text-center flex-shrink-0">
          {item.unit || 'UN'}
        </div>
      </div>

      {item.product_has_flavor && (
        <div className="mb-2">
          <label className="block text-xs text-violet-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Sabor
          </label>
          <input
            type="text"
            className="w-full bg-dark-700 border border-violet-500/40 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-dark-500 disabled:cursor-not-allowed"
            placeholder="Ex: Chocolate, Morango..."
            value={flavor}
            onChange={e => setFlavor(e.target.value)}
            onBlur={save}
            disabled={disabled}
          />
        </div>
      )}

      <div>
        <label className="block text-xs text-dark-400 mb-1">Observação</label>
        <input
          type="text"
          className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 placeholder-dark-500 disabled:cursor-not-allowed"
          placeholder="Opcional..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={save}
          disabled={disabled}
        />
      </div>

      {saving && <p className="text-xs text-dark-500 text-right mt-1.5">Salvando...</p>}
    </div>
  )
}

function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return null
  const diff = Math.floor((new Date(completedAt) - new Date(startedAt)) / 1000)
  if (diff < 60) return `${diff} seg`
  const min = Math.floor(diff / 60)
  const sec = diff % 60
  if (min < 60) return `${min}min ${sec > 0 ? sec + 's' : ''}`
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m > 0 ? m + 'min' : ''}`
}

export default function StockListPublicExecute() {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/stock/lists/${id}`)
        setList(data)
        setItems(data.items || [])

        // Inicia sessão de contagem automaticamente
        const { data: sessionData } = await api.post(`/stock/lists/${id}/start-counting`)
        setSession(sessionData.session)
      } catch (e) {
        setError(e.response?.status === 404 ? 'Lista não encontrada.' : 'Erro ao carregar lista.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleComplete = async () => {
    if (!confirm('Confirmar conclusão da contagem? Esta ação registrará o horário de término.')) return
    setCompleting(true)
    try {
      const { data } = await api.post(`/stock/lists/${id}/complete-counting`)
      setCompletedSession(data.session)
      setCompleted(true)
      toast.success('Contagem concluída!')
    } catch {
      toast.error('Erro ao concluir contagem')
    } finally {
      setCompleting(false)
    }
  }

  const handleShareResult = () => {
    if (!completedSession) return
    const started = new Date(completedSession.started_at)
    const ended = new Date(completedSession.completed_at)
    const duration = formatDuration(completedSession.started_at, completedSession.completed_at)
    const fmt = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const msg = [
      `✅ *Contagem de Estoque Concluída*`,
      ``,
      `📋 *Lista:* ${list?.name}`,
      `👤 *Responsável:* ${completedSession.counted_by_name}`,
      `🕐 *Início:* ${fmt(started)}`,
      `🕑 *Conclusão:* ${fmt(ended)}`,
      `⏱ *Duração:* ${duration}`,
      `📦 *Itens preenchidos:* ${completedSession.items_filled}/${completedSession.items_total}`,
    ].join('\n')

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

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

  if (list?.status === 'finalizada') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Lista já finalizada</p>
          <p className="text-dark-400 text-sm">Esta lista foi encerrada pelo gestor.</p>
        </div>
      </div>
    )
  }

  const filledItems = items.filter(i => i.quantity !== null && i.quantity !== undefined)
  const progress = items.length > 0 ? Math.round((filledItems.length / items.length) * 100) : 0
  const allFilled = items.length > 0 && filledItems.length === items.length

  if (completed && completedSession) {
    const duration = formatDuration(completedSession.started_at, completedSession.completed_at)
    const started = new Date(completedSession.started_at)
    const ended = new Date(completedSession.completed_at)
    const fmt = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Contagem Concluída!</h1>
            <p className="text-dark-400 text-sm">O gestor irá revisar e finalizar a lista.</p>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Lista</span>
              <span className="text-white font-medium truncate ml-4 text-right">{list?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Responsável</span>
              <span className="text-white font-medium">{completedSession.counted_by_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Início</span>
              <span className="text-white font-medium">{fmt(started)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Conclusão</span>
              <span className="text-white font-medium">{fmt(ended)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Duração</span>
              <span className="text-emerald-400 font-semibold">{duration}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Itens preenchidos</span>
              <span className="text-white font-medium">{completedSession.items_filled}/{completedSession.items_total}</span>
            </div>
          </div>

          <button
            onClick={handleShareResult}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Compartilhar resultado via WhatsApp
          </button>

          <p className="text-center text-xs text-dark-600 mt-6">CheckList Pro</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="mb-2">
            <p className="text-xs text-dark-400 uppercase tracking-wider">{TYPE_LABELS[list?.type] || list?.type}</p>
            <h1 className="text-lg font-bold text-white truncate">{list?.name}</h1>
            {session && (
              <p className="text-xs text-dark-500 mt-0.5">
                Iniciado às {new Date(session.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
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

      <div className="max-w-lg mx-auto px-4 py-4 pb-32">
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
                disabled={false}
                onSave={(updated) =>
                  setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
                }
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-dark-600 mt-8">CheckList Pro</p>
      </div>

      {/* Botão fixo de conclusão */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/50">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleComplete}
              disabled={completing}
              className={`w-full py-4 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 ${
                allFilled
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                  : 'bg-dark-800 border border-dark-600 text-dark-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {completing ? 'Concluindo...' : allFilled ? 'Concluir Contagem' : `Concluir (${filledItems.length}/${items.length} preenchidos)`}
            </button>
            {!allFilled && (
              <p className="text-center text-xs text-dark-500 mt-2">
                Itens sem quantidade serão registrados como não contados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
