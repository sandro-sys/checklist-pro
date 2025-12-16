import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Calendar,
  CheckSquare,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  ClipboardList,
  Clock,
  Target,
  Award,
  Filter,
  Settings,
  FileDown,
  Loader2,
  Image,
  Share2,
  Clipboard
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const METRIC_OPTIONS = [
  {
    id: 'summary',
    label: 'Resumo Geral',
    description: 'Total de execucoes, taxa de conclusao e media diaria',
    icon: BarChart3,
    category: 'geral'
  },
  {
    id: 'executions_by_day',
    label: 'Execucoes por Dia',
    description: 'Grafico de execucoes ao longo do periodo',
    icon: TrendingUp,
    category: 'geral'
  },
  {
    id: 'avg_time',
    label: 'Tempo Medio de Execucao',
    description: 'Tempo medio para concluir checklists',
    icon: Clock,
    category: 'geral'
  },
  {
    id: 'peak_hours',
    label: 'Horarios de Pico',
    description: 'Horarios com mais execucoes',
    icon: TrendingUp,
    category: 'geral'
  },
  {
    id: 'top_checklists',
    label: 'Checklists Mais Executados',
    description: 'Ranking dos checklists com mais execucoes',
    icon: ClipboardList,
    category: 'checklists'
  },
  {
    id: 'checklists_list',
    label: 'Lista de Checklists',
    description: 'Todos os checklists cadastrados com detalhes',
    icon: CheckSquare,
    category: 'checklists'
  },
  {
    id: 'top_users',
    label: 'Top Colaboradores',
    description: 'Ranking dos usuarios mais ativos',
    icon: Award,
    category: 'equipe'
  },
  {
    id: 'users_list',
    label: 'Lista de Colaboradores',
    description: 'Todos os colaboradores da equipe',
    icon: Users,
    category: 'equipe'
  },
  {
    id: 'categories_stats',
    label: 'Estatisticas por Categoria',
    description: 'Execucoes agrupadas por categoria',
    icon: PieChart,
    category: 'categorias'
  },
  {
    id: 'completion_rate',
    label: 'Taxa de Conclusao',
    description: 'Analise detalhada de conclusoes',
    icon: Target,
    category: 'geral'
  },
  {
    id: 'pending_executions',
    label: 'Execucoes Pendentes',
    description: 'Checklists em andamento nao finalizados',
    icon: Clock,
    category: 'geral'
  }
]

const PERIOD_OPTIONS = [
  { value: '7', label: 'Ultimos 7 dias' },
  { value: '15', label: 'Ultimos 15 dias' },
  { value: '30', label: 'Ultimos 30 dias' },
  { value: '60', label: 'Ultimos 60 dias' },
  { value: '90', label: 'Ultimos 90 dias' }
]

export default function Reports() {
  const { company, user } = useAuthStore()
  const [selectedMetrics, setSelectedMetrics] = useState(['summary', 'top_checklists', 'top_users'])
  const [period, setPeriod] = useState('30')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [stats, setStats] = useState(null)
  const [checklists, setChecklists] = useState([])
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [reportImage, setReportImage] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    if (company?.id) {
      fetchData()
    }
  }, [company, period])

  const fetchData = async () => {
    try {
      const [statsRes, checklistsRes, categoriesRes] = await Promise.all([
        api.get(`/executions/stats/${company.id}?period=${period}`),
        api.get(`/checklists/company/${company.id}`),
        api.get(`/companies/${company.id}/categories`)
      ])
      setStats(statsRes.data)
      setChecklists(checklistsRes.data)
      setCategories(categoriesRes.data)

      // Tentar buscar usuarios
      try {
        const usersRes = await api.get(`/users?company_id=${company.id}`)
        setUsers(usersRes.data)
      } catch (e) {
        setUsers([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const toggleMetric = (metricId) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    )
  }

  const selectAllMetrics = () => {
    setSelectedMetrics(METRIC_OPTIONS.map(m => m.id))
  }

  const clearAllMetrics = () => {
    setSelectedMetrics([])
  }

  // Funcao para desenhar grafico de barras horizontais
  const drawBarChart = (doc, data, startY, title, color) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const chartX = 20
    const chartWidth = pageWidth - 40
    const barHeight = 12
    const barSpacing = 6
    const labelWidth = 70
    
    // Titulo
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text(title, chartX, startY)
    
    let y = startY + 12
    
    // Encontrar valor maximo para escala
    const maxValue = Math.max(...data.map(d => d.value), 1)
    const barMaxWidth = chartWidth - labelWidth - 30
    
    data.forEach((item, index) => {
      // Label
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      const label = item.label.length > 25 ? item.label.substring(0, 22) + '...' : item.label
      doc.text(label, chartX, y + barHeight / 2 + 2)
      
      // Barra de fundo (cinza claro)
      doc.setFillColor(230, 230, 230)
      doc.roundedRect(chartX + labelWidth, y, barMaxWidth, barHeight, 2, 2, 'F')
      
      // Barra de valor
      const barWidth = maxValue > 0 ? (item.value / maxValue) * barMaxWidth : 0
      if (barWidth > 0) {
        doc.setFillColor(color[0], color[1], color[2])
        doc.roundedRect(chartX + labelWidth, y, Math.max(barWidth, 4), barHeight, 2, 2, 'F')
      }
      
      // Valor dentro da barra (ou ao lado se muito pequena)
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      const valueText = item.value.toString()
      const textWidth = doc.getTextWidth(valueText)
      
      if (barWidth > textWidth + 10) {
        // Valor dentro da barra (alinhado a direita)
        doc.text(valueText, chartX + labelWidth + barWidth - 5, y + barHeight / 2 + 3, { align: 'right' })
      } else {
        // Valor fora da barra
        doc.setTextColor(60, 60, 60)
        doc.text(valueText, chartX + labelWidth + barWidth + 5, y + barHeight / 2 + 3)
      }
      
      y += barHeight + barSpacing
    })
    
    return y + 10
  }

  const generatePDF = async () => {
    if (selectedMetrics.length === 0) {
      toast.error('Selecione pelo menos uma metrica')
      return
    }

    setIsGenerating(true)

    try {
      // Criar documento PDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPosition = 20

      // Header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text('Relatorio de Metricas', pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 10
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(company.name, pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 8
      doc.setFontSize(10)
      const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || ''
      doc.text(`Periodo: ${periodLabel}`, pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 5
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 5
      doc.text(`Por: ${user?.name}`, pageWidth / 2, yPosition, { align: 'center' })

      // Linha divisoria
      yPosition += 10
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPosition, pageWidth - 20, yPosition)
      yPosition += 15

      // Resumo Geral
      if (selectedMetrics.includes('summary')) {
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Resumo Geral', 20, yPosition)
        yPosition += 10

        const summaryData = [
          ['Total de Execucoes', stats?.total_executions?.toString() || '0'],
          ['Execucoes Concluidas', stats?.completed_executions?.toString() || '0'],
          ['Taxa de Conclusao', `${stats?.completion_rate || 0}%`],
          ['Media por Dia', stats?.avg_executions_per_day?.toString() || '0'],
          ['Execucoes Hoje', stats?.today_executions?.toString() || '0'],
          ['Em Andamento', stats?.in_progress_executions?.toString() || '0'],
          ['Total de Checklists', checklists.length.toString()],
          ['Total de Categorias', categories.length.toString()]
        ]

        autoTable(doc, {
          startY: yPosition,
          head: [['Metrica', 'Valor']],
          body: summaryData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 20 }
        })

        yPosition = doc.lastAutoTable.finalY + 15
      }

      // Taxa de Conclusao com grafico
      if (selectedMetrics.includes('completion_rate')) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        const total = stats?.total_executions || 0
        const completed = stats?.completed_executions || 0
        const inProgress = stats?.in_progress_executions || 0
        const rate = stats?.completion_rate || 0

        // Grafico de barras para taxa de conclusao
        const completionChartData = [
          { label: 'Concluidas', value: completed },
          { label: 'Em Andamento', value: inProgress },
          { label: 'Total', value: total }
        ]
        
        yPosition = drawBarChart(doc, completionChartData, yPosition, 'Analise de Conclusao', [16, 185, 129])
        
        // Info adicional
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        const avaliacao = rate >= 80 ? 'Excelente' : rate >= 60 ? 'Bom' : rate >= 40 ? 'Regular' : 'Precisa Melhorar'
        doc.text(`Taxa de Sucesso: ${rate}% - Avaliacao: ${avaliacao}`, 20, yPosition)
        yPosition += 15
      }

      // Execucoes por Dia com grafico
      if (selectedMetrics.includes('executions_by_day') && stats?.executions_by_day?.length > 0) {
        if (yPosition > 180) {
          doc.addPage()
          yPosition = 20
        }

        const dailyChartData = stats.executions_by_day.slice(-10).map(d => ({
          label: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: d.count
        }))

        yPosition = drawBarChart(doc, dailyChartData, yPosition, 'Execucoes por Dia', [139, 92, 246])
      }

      // Top Checklists com grafico
      if (selectedMetrics.includes('top_checklists') && stats?.top_checklists?.length > 0) {
        const topChecklistsFiltered = stats.top_checklists.filter(c => c.execution_count > 0)
        
        if (topChecklistsFiltered.length > 0) {
          if (yPosition > 180) {
            doc.addPage()
            yPosition = 20
          }

          const checklistsChartData = topChecklistsFiltered.slice(0, 8).map(c => ({
            label: c.title,
            value: c.execution_count
          }))

          yPosition = drawBarChart(doc, checklistsChartData, yPosition, 'Checklists Mais Executados', [245, 158, 11])
        }
      }

      // Lista de Checklists (tabela)
      if (selectedMetrics.includes('checklists_list') && checklists.length > 0) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Lista de Checklists', 20, yPosition)
        yPosition += 10

        const checklistsData = checklists.map(c => [
          c.title,
          c.category_name || 'Sem categoria',
          c.items_count?.toString() || '0',
          c.executions_count?.toString() || '0',
          c.is_active ? 'Ativo' : 'Inativo'
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Titulo', 'Categoria', 'Itens', 'Execucoes', 'Status']],
          body: checklistsData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 35 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 }
          }
        })

        yPosition = doc.lastAutoTable.finalY + 15
      }

      // Top Users com grafico
      if (selectedMetrics.includes('top_users') && stats?.top_users?.length > 0) {
        if (yPosition > 180) {
          doc.addPage()
          yPosition = 20
        }

        const usersChartData = stats.top_users.slice(0, 8).map(u => ({
          label: u.name,
          value: u.execution_count
        }))

        yPosition = drawBarChart(doc, usersChartData, yPosition, 'Top Colaboradores', [236, 72, 153])
      }

      // Lista de Usuarios (tabela)
      if (selectedMetrics.includes('users_list') && users.length > 0) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Lista de Colaboradores', 20, yPosition)
        yPosition += 10

        const usersData = users.map(u => [
          u.name,
          u.email,
          u.role_name || u.role_type || '-',
          u.is_active ? 'Ativo' : 'Inativo'
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Nome', 'Email', 'Funcao', 'Status']],
          body: usersData,
          theme: 'striped',
          headStyles: { fillColor: [20, 184, 166] },
          margin: { left: 20, right: 20 }
        })

        yPosition = doc.lastAutoTable.finalY + 15
      }

      // Estatisticas por Categoria com grafico
      if (selectedMetrics.includes('categories_stats') && stats?.executions_by_category?.length > 0) {
        if (yPosition > 180) {
          doc.addPage()
          yPosition = 20
        }

        const categoriesChartData = stats.executions_by_category.slice(0, 8).map(c => ({
          label: c.name,
          value: c.execution_count
        }))

        yPosition = drawBarChart(doc, categoriesChartData, yPosition, 'Execucoes por Categoria', [99, 102, 241])
      }

      // Tempo Medio de Execucao
      if (selectedMetrics.includes('avg_time')) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Tempo Medio de Execucao', 20, yPosition)
        yPosition += 10

        const avgTimeData = [
          ['Tempo Medio', stats?.avg_execution_time_formatted || '0min'],
          ['Tempo em Minutos', `${stats?.avg_execution_time_minutes || 0} minutos`],
          ['Taxa de Conformidade', `${stats?.avg_conformity_rate || 0}%`]
        ]

        autoTable(doc, {
          startY: yPosition,
          head: [['Metrica', 'Valor']],
          body: avgTimeData,
          theme: 'striped',
          headStyles: { fillColor: [45, 212, 191] },
          margin: { left: 20, right: 20 }
        })

        yPosition = doc.lastAutoTable.finalY + 15
      }

      // Horarios de Pico
      if (selectedMetrics.includes('peak_hours') && stats?.executions_by_hour?.length > 0) {
        if (yPosition > 180) {
          doc.addPage()
          yPosition = 20
        }

        const hourLabels = ['6h', '7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h']
        const hourData = new Array(24).fill(0)
        stats.executions_by_hour.forEach(item => {
          hourData[item.hour] = item.count
        })

        // Filtrar apenas horario comercial (6h-22h)
        const peakHoursData = []
        for (let h = 6; h <= 22; h++) {
          if (hourData[h] > 0) {
            peakHoursData.push({ label: `${h}h`, value: hourData[h] })
          }
        }

        if (peakHoursData.length > 0) {
          yPosition = drawBarChart(doc, peakHoursData.slice(0, 10), yPosition, 'Horarios de Pico', [45, 212, 191])
        }

        // Dias da semana
        if (stats?.executions_by_weekday?.length > 0) {
          const weekdayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
          const weekdayData = stats.executions_by_weekday.map(d => ({
            label: weekdayNames[d.weekday],
            value: d.count
          }))

          yPosition = drawBarChart(doc, weekdayData, yPosition, 'Execucoes por Dia da Semana', [139, 92, 246])
        }
      }

      // Execucoes Pendentes
      if (selectedMetrics.includes('pending_executions')) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Execucoes Pendentes', 20, yPosition)
        yPosition += 10

        const pendingData = [
          ['Total em Andamento', (stats?.in_progress_executions || 0).toString()],
          ['Recomendacao', stats?.in_progress_executions > 5 ? 'Verificar execucoes abandonadas' : 'Situacao normal']
        ]

        autoTable(doc, {
          startY: yPosition,
          head: [['Indicador', 'Valor']],
          body: pendingData,
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 20, right: 20 }
        })

        yPosition = doc.lastAutoTable.finalY + 15
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Pagina ${i} de ${pageCount} - CheckList App - Powered by SO.RH.IA`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      // Salvar PDF
      const fileName = `relatorio-${company.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast.success('Relatorio gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar relatorio')
    } finally {
      setIsGenerating(false)
    }
  }

  // Gerar imagem do relatorio
  const generateImage = async () => {
    setIsGeneratingImage(true)
    try {
      const response = await api.get(`/executions/stats/${company.id}/image?period=${period}`, {
        responseType: 'blob'
      })
      
      const imageUrl = URL.createObjectURL(response.data)
      setReportImage(imageUrl)
      setShowImageModal(true)
      toast.success('Imagem gerada com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar imagem:', error)
      toast.error('Erro ao gerar imagem do relatorio')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Download da imagem
  const handleDownloadImage = () => {
    if (!reportImage) return
    const link = document.createElement('a')
    link.href = reportImage
    link.download = `relatorio-${company.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`
    link.click()
    toast.success('Imagem baixada!')
  }

  // Copiar imagem para clipboard
  const handleCopyImage = async () => {
    if (!reportImage) return
    try {
      const response = await fetch(reportImage)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      toast.success('Imagem copiada para a area de transferencia!')
    } catch (error) {
      console.error('Erro ao copiar imagem:', error)
      toast.error('Erro ao copiar. Baixe a imagem.')
      handleDownloadImage()
    }
  }

  // Compartilhar via WhatsApp
  const handleShareWhatsApp = () => {
    const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || ''
    const text = encodeURIComponent(
      `Relatorio de Metricas - ${company.name}\n` +
      `Periodo: ${periodLabel}\n` +
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      `Copie a imagem e cole na conversa para enviar o relatorio completo.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
    toast.success('Abrindo WhatsApp. Cole a imagem na conversa!')
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText className="w-12 h-12 text-dark-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Empresa nao cadastrada</h2>
        <p className="text-dark-400">Cadastre sua empresa para gerar relatorios.</p>
      </div>
    )
  }

  const groupedMetrics = {
    geral: METRIC_OPTIONS.filter(m => m.category === 'geral'),
    checklists: METRIC_OPTIONS.filter(m => m.category === 'checklists'),
    equipe: METRIC_OPTIONS.filter(m => m.category === 'equipe'),
    categorias: METRIC_OPTIONS.filter(m => m.category === 'categorias')
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Exportar Relatorio</h1>
          <p className="text-dark-400 mt-1">Gere relatorios em PDF ou imagem para compartilhar</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateImage}
            disabled={isGeneratingImage}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-accent-teal to-green-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-teal/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Image className="w-5 h-5" />
                Gerar Imagem
              </>
            )}
          </button>
          <button
            onClick={generatePDF}
            disabled={isGenerating || selectedMetrics.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                Gerar PDF
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Configuracoes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">Configuracoes do Relatorio</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Periodo */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Periodo de Analise
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Selecao rapida */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Selecao Rapida
            </label>
            <div className="flex gap-3">
              <button
                onClick={selectAllMetrics}
                className="flex-1 px-4 py-3 bg-primary-500/20 text-primary-400 rounded-xl hover:bg-primary-500/30 transition-colors font-medium"
              >
                Selecionar Todas
              </button>
              <button
                onClick={clearAllMetrics}
                className="flex-1 px-4 py-3 bg-dark-700 text-dark-300 rounded-xl hover:bg-dark-600 transition-colors font-medium"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-dark-700/30 rounded-xl">
          <p className="text-sm text-dark-400">
            <span className="text-primary-400 font-medium">{selectedMetrics.length}</span> metrica(s) selecionada(s)
          </p>
        </div>
      </motion.div>

      {/* Metricas */}
      <div className="space-y-6">
        {/* Geral */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">Metricas Gerais</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {groupedMetrics.geral.map(metric => (
              <MetricCard
                key={metric.id}
                metric={metric}
                selected={selectedMetrics.includes(metric.id)}
                onToggle={() => toggleMetric(metric.id)}
              />
            ))}
          </div>
        </motion.div>

        {/* Checklists */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">Checklists</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {groupedMetrics.checklists.map(metric => (
              <MetricCard
                key={metric.id}
                metric={metric}
                selected={selectedMetrics.includes(metric.id)}
                onToggle={() => toggleMetric(metric.id)}
              />
            ))}
          </div>
        </motion.div>

        {/* Equipe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">Equipe</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {groupedMetrics.equipe.map(metric => (
              <MetricCard
                key={metric.id}
                metric={metric}
                selected={selectedMetrics.includes(metric.id)}
                onToggle={() => toggleMetric(metric.id)}
              />
            ))}
          </div>
        </motion.div>

        {/* Categorias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">Categorias</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {groupedMetrics.categorias.map(metric => (
              <MetricCard
                key={metric.id}
                metric={metric}
                selected={selectedMetrics.includes(metric.id)}
                onToggle={() => toggleMetric(metric.id)}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modal de Imagem do Relatorio */}
      {showImageModal && reportImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Relatorio de Metricas</h3>
                <p className="text-sm text-dark-400">{company.name} - {PERIOD_OPTIONS.find(p => p.value === period)?.label}</p>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Imagem */}
            <div className="p-4 overflow-auto max-h-[60vh] bg-dark-900/50">
              <img
                src={reportImage}
                alt="Relatorio de Metricas"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>

            {/* Botoes de Acao */}
            <div className="p-4 border-t border-dark-700 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center justify-center gap-2 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Baixar
                </button>
                <button
                  onClick={handleCopyImage}
                  className="flex items-center justify-center gap-2 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors"
                >
                  <Clipboard className="w-5 h-5" />
                  Copiar
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
              <p className="text-xs text-dark-500 text-center">
                Dica: Copie a imagem e cole diretamente no WhatsApp para compartilhar
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

function MetricCard({ metric, selected, onToggle }) {
  const Icon = metric.icon

  return (
    <button
      onClick={onToggle}
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left w-full ${
        selected
          ? 'bg-primary-500/10 border-primary-500/30 hover:border-primary-500/50'
          : 'bg-dark-800/50 border-dark-700/50 hover:border-dark-600'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        selected ? 'bg-primary-500/20' : 'bg-dark-700'
      }`}>
        <Icon className={`w-5 h-5 ${selected ? 'text-primary-400' : 'text-dark-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium ${selected ? 'text-primary-400' : 'text-white'}`}>
          {metric.label}
        </h4>
        <p className="text-dark-400 text-sm mt-0.5">{metric.description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-primary-500 bg-primary-500' : 'border-dark-500'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  )
}

