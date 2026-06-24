import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, CheckCircle, Clock, Download, Eye, X, ClipboardList, ClipboardCheck, User, Share2, Copy, ExternalLink, QrCode, CopyPlus, Upload, AlertCircle, Info, ChevronRight, ChevronLeft, Loader2, Trash2, Check, RotateCcw, Inbox } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

function StockShareModal({ list, onClose }) {
  const shareUrl = `${window.location.origin}/contar/${list.id}`
  const [qrCode, setQrCode] = useState(null)
  const [loadingQr, setLoadingQr] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get(`/qrcode/stock/${list.id}`)
      .then(({ data }) => setQrCode(data.qr_code))
      .catch(() => {})
      .finally(() => setLoadingQr(false))
  }, [list.id])

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiado!')
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-bold text-white">Compartilhar Lista</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-dark-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-dark-400 text-sm mb-4 truncate">{list.name}</p>

        {loadingQr ? (
          <div className="bg-dark-700/50 rounded-xl p-8 mb-4 text-center">
            <p className="text-dark-500 text-sm">Gerando QR Code...</p>
          </div>
        ) : qrCode ? (
          <div className="bg-white p-3 rounded-xl mb-4">
            <img src={qrCode} alt="QR Code" className="w-full aspect-square" />
          </div>
        ) : (
          <div className="bg-dark-700/50 border border-dashed border-dark-600 rounded-xl p-6 mb-4 text-center">
            <QrCode className="w-8 h-8 text-dark-500 mx-auto mb-2" />
            <p className="text-dark-500 text-sm">QR Code indisponível</p>
          </div>
        )}

        <div className="bg-dark-700 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
          <span className="text-dark-300 text-xs flex-1 truncate">{shareUrl}</span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copyLink}
              className="flex items-center justify-center gap-2 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Copy className="w-4 h-4" /> {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
            <button onClick={() => {
              const text = encodeURIComponent(`Olá! Por favor, preencha a contagem de estoque "${list.name}":\n${shareUrl}`)
              window.open(`https://wa.me/?text=${text}`, '_blank')
            }}
              className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
          </div>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-sm font-medium transition-colors">
            <ExternalLink className="w-4 h-4" /> Abrir em nova aba
          </a>
        </div>
      </div>
    </div>
  )
}

const TYPE_LABELS = { contagem: 'Contagem', compras: 'Compras', inventario: 'Inventário' }
const TYPE_COLORS = {
  contagem:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  compras:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inventario: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

function NewListModal({ onClose, onCreate, users }) {
  const [form, setForm] = useState({ name: '', type: 'contagem', notes: '' })
  const [assignedToIds, setAssignedToIds] = useState([])
  const [saving, setSaving] = useState(false)

  const defaultName = () => {
    const d = new Date()
    const label = TYPE_LABELS[form.type] || form.type
    return `${label.toUpperCase()} ${d.toLocaleDateString('pt-BR')}`
  }

  const toggleAssignee = (userId) => {
    setAssignedToIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const name = form.name.trim() || defaultName()
      const { data } = await api.post('/stock/lists', {
        name,
        type: form.type,
        notes: form.notes,
        assigned_to_ids: assignedToIds
      })
      toast.success('Lista criada')
      onCreate(data.list)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar lista')
    } finally {
      setSaving(false)
    }
  }

  const activeUsers = users.filter(u => u.is_active)

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
          {activeUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Responsáveis <span className="text-dark-500 text-xs">(opcional — pode ser mais de um)</span></label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {activeUsers.map(u => (
                  <button key={u.id} type="button" onClick={() => toggleAssignee(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left ${
                      assignedToIds.includes(u.id)
                        ? 'bg-primary-500/20 border-primary-500/40 text-white'
                        : 'bg-dark-700 border-dark-600 text-dark-300 hover:text-white hover:border-dark-500'
                    }`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${assignedToIds.includes(u.id) ? 'bg-primary-500 border-primary-500' : 'border-dark-500'}`}>
                      {assignedToIds.includes(u.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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

const TYPE_LABELS_MODAL = { contagem: 'Contagem de Estoque', compras: 'Lista de Compras', inventario: 'Inventário' }

function ImportTxtModal({ onClose, onImported }) {
  const [step, setStep] = useState('instrucoes') // instrucoes | editar | preview
  const [name, setName] = useState('')
  const [type, setType] = useState('contagem')
  const [content, setContent] = useState('')
  const [parsed, setParsed] = useState([])
  const [importing, setImporting] = useState(false)

  const parseContent = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'))
    return lines.map((line, idx) => {
      const parts = line.split(';')
      const itemName = parts[0].trim().toUpperCase()
      const unit = parts[1] ? parts[1].trim().toUpperCase() : null
      return { idx: idx + 1, name: itemName, unit, hasUnit: !!parts[1] }
    }).filter(i => i.name.length > 0)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setContent(ev.target.result)
    reader.readAsText(file, 'UTF-8')
  }

  const goToPreview = () => {
    if (!name.trim()) { return toast.error('Informe o nome da lista') }
    if (!content.trim()) { return toast.error('Cole ou carregue o conteúdo da lista') }
    const items = parseContent(content)
    if (items.length === 0) return toast.error('Nenhum item válido encontrado')
    setParsed(items)
    setStep('preview')
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const { data } = await api.post('/stock/lists/import-txt', { name, type, content })
      toast.success(data.message)
      onImported(data.list)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao importar')
    } finally {
      setImporting(false)
    }
  }

  const withoutUnit = parsed.filter(i => !i.hasUnit)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Importar Lista por Texto</h2>
              <p className="text-dark-400 text-xs">
                {step === 'instrucoes' ? 'Passo 1 de 3 — Como funciona' : step === 'editar' ? 'Passo 2 de 3 — Configurar e colar' : 'Passo 3 de 3 — Revisar e importar'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de progresso */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {['instrucoes', 'editar', 'preview'].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step === s || (s === 'instrucoes' && step !== 'instrucoes') || (s === 'editar' && step === 'preview') ? 'bg-primary-500' : 'bg-dark-700'}`} />
          ))}
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* PASSO 1: INSTRUÇÕES */}
          {step === 'instrucoes' && (
            <div className="space-y-5">
              <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-primary-400 font-semibold mb-2">
                  <Info className="w-4 h-4" /> Como preparar o arquivo
                </div>
                <p className="text-dark-300 text-sm leading-relaxed">
                  Crie um arquivo de texto (<span className="text-white font-mono">.txt</span>) ou planilha (<span className="text-white font-mono">.csv</span>) com um produto por linha, no formato:
                </p>
              </div>

              {/* Formato */}
              <div>
                <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-2">Formato de cada linha</p>
                <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 font-mono text-sm">
                  <p className="text-emerald-400">Nome do produto<span className="text-dark-500">;</span>Unidade</p>
                  <p className="text-dark-400 text-xs mt-2">Exemplos:</p>
                  <p className="text-white">AÇÚCAR REFINADO<span className="text-primary-400">;</span>KG</p>
                  <p className="text-white">FARINHA DE TRIGO<span className="text-primary-400">;</span>KG</p>
                  <p className="text-white">CREME DE LEITE<span className="text-primary-400">;</span>CX</p>
                  <p className="text-white">CHOCOLATE EM PÓ<span className="text-primary-400">;</span>KG</p>
                  <p className="text-white">OVOS<span className="text-primary-400">;</span>DZ</p>
                </div>
              </div>

              {/* Regras */}
              <div className="space-y-2">
                <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider">Regras</p>
                <div className="space-y-2 text-sm text-dark-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Separe nome e unidade com ponto e vírgula <span className="font-mono text-white">;</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Um produto por linha</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>A unidade de medida é opcional — se não informar, o sistema usa <span className="font-mono text-white">UN</span> e você ajusta depois</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Linhas começando com <span className="font-mono text-white">#</span> são ignoradas (comentários)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Máximo de 500 itens por importação</span>
                  </div>
                </div>
              </div>

              {/* Excel */}
              <div className="p-4 bg-dark-700/50 border border-dark-600 rounded-xl text-sm text-dark-300">
                <p className="text-white font-medium mb-1">Usando Excel ou Google Sheets?</p>
                <p>Coloque os nomes na coluna A e as unidades na coluna B, depois salve como <span className="font-mono text-white">CSV (separado por ponto e vírgula)</span>. O arquivo gerado já está no formato correto para importação.</p>
              </div>
            </div>
          )}

          {/* PASSO 2: CONFIGURAR E COLAR */}
          {step === 'editar' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-dark-300 mb-1.5">Nome da lista <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Compras da Semana"
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary-500 placeholder-dark-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-dark-300 mb-1.5">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPE_LABELS_MODAL).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setType(val)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${type === val ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-dark-700 border-dark-600 text-dark-400 hover:text-white hover:border-dark-500'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-dark-300">Conteúdo da lista <span className="text-rose-400">*</span></label>
                  <label className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Carregar arquivo
                    <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={12}
                  placeholder={"# Cole aqui ou carregue um arquivo\nAÇÚCAR REFINADO;KG\nFARINHA DE TRIGO;KG\nCHOCOLATE EM PÓ;KG\nCREME DE LEITE;CX\nOVOS;DZ"}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary-500 placeholder-dark-600 resize-none"
                  spellCheck={false}
                />
                {content && (
                  <p className="text-xs text-dark-500 mt-1">{parseContent(content).length} item(ns) detectado(s)</p>
                )}
              </div>
            </div>
          )}

          {/* PASSO 3: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold">{name}</p>
                  <p className="text-dark-400 text-sm">{TYPE_LABELS_MODAL[type]} · {parsed.length} itens</p>
                </div>
                {withoutUnit.length > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {withoutUnit.length} sem unidade — será configurado como UN
                  </div>
                )}
              </div>

              <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2 border-b border-dark-700 text-xs text-dark-500 uppercase tracking-wider font-semibold">
                  <span>Produto</span>
                  <span className="w-16 text-right">Unidade</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-dark-700/50">
                  {parsed.map(item => (
                    <div key={item.idx} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 items-center">
                      <span className="text-white text-sm font-mono">{item.name}</span>
                      <span className={`w-16 text-right text-sm font-mono ${item.hasUnit ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.unit || 'UN *'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {withoutUnit.length > 0 && (
                <p className="text-xs text-dark-500">
                  * Itens marcados com <span className="text-amber-400">UN *</span> não tinham unidade no arquivo. Você poderá ajustar na edição da lista.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer com botões de navegação */}
        <div className="flex items-center justify-between p-6 border-t border-dark-700 flex-shrink-0">
          {step === 'instrucoes' && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-dark-400 hover:text-white transition-colors text-sm">Cancelar</button>
              <button onClick={() => setStep('editar')} className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 'editar' && (
            <>
              <button onClick={() => setStep('instrucoes')} className="flex items-center gap-2 px-4 py-2 text-dark-400 hover:text-white transition-colors text-sm">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              <button onClick={goToPreview} className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors">
                Revisar <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('editar')} className="flex items-center gap-2 px-4 py-2 text-dark-400 hover:text-white transition-colors text-sm">
                <ChevronLeft className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importando...' : `Importar ${parsed.length} itens`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StockLists() {
  const [lists, setLists] = useState([])
  const [trash, setTrash] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportTxt, setShowImportTxt] = useState(false)
  const [shareList, setShareList] = useState(null)
  const [showTrash, setShowTrash] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const load = async () => {
    setLoading(true)
    try {
      const [listsRes, usersRes, trashRes] = await Promise.all([
        api.get('/stock/lists'),
        api.get('/users'),
        api.get('/stock/lists/trash')
      ])
      setLists(listsRes.data)
      setUsers(usersRes.data)
      setTrash(trashRes.data)
    } catch {
      toast.error('Erro ao carregar listas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCopyList = async (list) => {
    try {
      const { data } = await api.post(`/stock/lists/${list.id}/copy`)
      toast.success(`Lista "${list.name}" copiada`)
      navigate(`/estoque/listas/${data.list.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao copiar lista')
    }
  }

  const handleDeleteList = async (list) => {
    if (!confirm(`Mover "${list.name}" para a lixeira?`)) return
    try {
      await api.delete(`/stock/lists/${list.id}`)
      setLists(prev => prev.filter(l => l.id !== list.id))
      setTrash(prev => [{ ...list, deleted_at: new Date().toISOString() }, ...prev])
      toast.success('Lista movida para a lixeira')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir lista')
    }
  }

  const handleRestoreList = async (list) => {
    try {
      await api.post(`/stock/lists/${list.id}/restore`)
      setTrash(prev => prev.filter(l => l.id !== list.id))
      await load()
      toast.success(`"${list.name}" restaurada`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao restaurar lista')
    }
  }

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

  const myPendingLists = lists.filter(l => {
    const ids = Array.isArray(l.assigned_to_ids) ? l.assigned_to_ids : []
    return ids.includes(user?.id) || l.assigned_to === user?.id
  })
  const myPendingIds = new Set(myPendingLists.map(l => l.id))
  const otherLists = lists.filter(l => !myPendingIds.has(l.id))

  const ListCard = ({ list, highlight }) => {
    const assignedNames = Array.isArray(list.assigned_to_names) ? list.assigned_to_names : []
    return (
      <div className={`border rounded-2xl p-5 transition-all ${
        highlight
          ? 'bg-primary-500/10 border-primary-500/30 hover:border-primary-500/50'
          : 'bg-dark-800/50 border-dark-700/50 hover:border-dark-600'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[list.type]}`}>
                {TYPE_LABELS[list.type]}
              </span>
            </div>
            <h3 className="text-white font-semibold mt-2 truncate">{list.name}</h3>
            {list.notes && <p className="text-dark-400 text-xs mt-0.5 truncate">{list.notes}</p>}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => setShareList(list)} className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Compartilhar link de contagem">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={() => handleCopyList(list)} className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Copiar lista">
              <CopyPlus className="w-4 h-4" />
            </button>
            <button onClick={() => handleExport(list)} className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Exportar TXT">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => navigate(`/estoque/listas/${list.id}/executar`)} className="p-2 text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Iniciar contagem">
              <ClipboardCheck className="w-4 h-4" />
            </button>
            <button onClick={() => navigate(`/estoque/listas/${list.id}`)} className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors" title="Editar lista">
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={() => handleDeleteList(list)} className="p-2 text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Excluir lista">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {assignedNames.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <User className="w-3 h-3 text-dark-500 flex-shrink-0" />
            <span className="text-xs text-dark-400">{assignedNames.join(', ')}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-dark-500 pt-3 border-t border-dark-700/50">
          <span>{list.items_count} {list.items_count === 1 ? 'item' : 'itens'}</span>
          <span>•</span>
          <span>{list.created_by_name}</span>
          <span>•</span>
          <span>{new Date(list.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Listas de Estoque</h1>
          <p className="text-dark-400 text-sm mt-1">{lists.length} lista(s) criada(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportTxt(true)} className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 rounded-xl transition-all text-sm">
            <Upload className="w-4 h-4" /> Importar TXT
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all">
            <Plus className="w-4 h-4" /> Nova Lista
          </button>
        </div>
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
        <div className="space-y-8">

          {/* Minhas Contagens — visível só para quem tem listas atribuídas */}
          {myPendingLists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-4 h-4 text-primary-400" />
                <h2 className="text-sm font-semibold text-primary-400 uppercase tracking-wider">
                  Minhas Contagens ({myPendingLists.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {myPendingLists.map(l => (
                  <div key={l.id} className="flex flex-col gap-3">
                    <ListCard list={l} highlight />
                    <button
                      onClick={() => navigate(`/estoque/listas/${l.id}/executar`)}
                      className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <ClipboardCheck className="w-4 h-4" /> Iniciar Contagem
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherLists.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Todas as Listas ({lists.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {otherLists.map(l => <ListCard key={l.id} list={l} />)}
              </div>
            </div>
          )}

          {/* Lixeira */}
          {trash.length > 0 && (
            <div>
              <button
                onClick={() => setShowTrash(prev => !prev)}
                className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-300 transition-colors mb-3"
              >
                <Inbox className="w-4 h-4" />
                <span className="uppercase tracking-wider font-semibold">Lixeira ({trash.length})</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${showTrash ? 'rotate-90' : ''}`} />
              </button>
              {showTrash && (
                <div className="space-y-2">
                  {trash.map(l => (
                    <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-dark-800/30 border border-dark-700/40 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-dark-400 text-sm truncate">{l.name}</p>
                        <p className="text-dark-600 text-xs mt-0.5">
                          Excluída em {new Date(l.deleted_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestoreList(l)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-colors flex-shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NewListModal
          users={users}
          onClose={() => setShowModal(false)}
          onCreate={(list) => { setShowModal(false); navigate(`/estoque/listas/${list.id}`) }}
        />
      )}

      {shareList && (
        <StockShareModal
          list={shareList}
          onClose={() => setShareList(null)}
        />
      )}

      {showImportTxt && (
        <ImportTxtModal
          onClose={() => setShowImportTxt(false)}
          onImported={(list) => { setShowImportTxt(false); navigate(`/estoque/listas/${list.id}`) }}
        />
      )}
    </div>
  )
}
