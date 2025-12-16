import { createCanvas } from 'canvas';

// Função para formatar data no fuso horário de Brasília
function formatDateBrasilia(date) {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Cores do tema CheckList App
const COLORS = {
  background: '#0f1419',
  cardBg: '#1a1f26',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  accent: '#2dd4bf',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  textWhite: '#ffffff',
  textLight: '#e5e7eb',
  textMuted: '#9ca3af',
  textDark: '#6b7280',
  border: '#374151'
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Gera uma imagem do relatório de métricas
 */
export async function generateReportImage(data) {
  const {
    companyName,
    period,
    generatedBy,
    stats
  } = data;

  // Dimensões
  const width = 900;
  const height = 1400;
  const padding = 40;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background com gradiente
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(0.5, '#151a21');
  gradient.addColorStop(1, COLORS.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Padrão decorativo
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }

  let y = padding;

  // ============ HEADER ============
  // Badge
  const badgeGradient = ctx.createLinearGradient(width/2 - 35, y, width/2 + 35, y + 70);
  badgeGradient.addColorStop(0, COLORS.primary);
  badgeGradient.addColorStop(1, COLORS.accent);
  
  ctx.beginPath();
  ctx.arc(width / 2, y + 35, 35, 0, Math.PI * 2);
  ctx.fillStyle = badgeGradient;
  ctx.fill();

  // Ícone de gráfico
  ctx.strokeStyle = COLORS.textWhite;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(width/2 - 15, y + 45);
  ctx.lineTo(width/2 - 15, y + 25);
  ctx.moveTo(width/2 - 5, y + 45);
  ctx.lineTo(width/2 - 5, y + 35);
  ctx.moveTo(width/2 + 5, y + 45);
  ctx.lineTo(width/2 + 5, y + 28);
  ctx.moveTo(width/2 + 15, y + 45);
  ctx.lineTo(width/2 + 15, y + 32);
  ctx.stroke();

  y += 90;

  // Título
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'center';
  ctx.fillText('RELATÓRIO DE MÉTRICAS', width / 2, y);
  y += 25;

  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('CheckList App', width / 2, y);
  y += 40;

  // Info da empresa
  ctx.fillStyle = COLORS.cardBg;
  roundRect(ctx, padding, y, width - padding * 2, 80, 12);
  ctx.fill();

  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'left';
  ctx.fillText(companyName, padding + 20, y + 30);

  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(`Período: ${period}`, padding + 20, y + 50);
  ctx.fillText(`Gerado por: ${generatedBy}`, padding + 20, y + 68);

  ctx.textAlign = 'right';
  ctx.fillText(formatDateBrasilia(new Date()), width - padding - 20, y + 50);

  y += 110;

  // ============ CARDS DE MÉTRICAS PRINCIPAIS ============
  const cardWidth = (width - padding * 2 - 30) / 4;
  const cardHeight = 90;

  const mainMetrics = [
    { label: 'Execuções', value: stats.total_executions?.toString() || '0', color: COLORS.primary },
    { label: 'Concluídas', value: stats.completed_executions?.toString() || '0', color: COLORS.success },
    { label: 'Taxa Conclusão', value: `${stats.completion_rate || 0}%`, color: COLORS.accent },
    { label: 'Tempo Médio', value: stats.avg_execution_time_formatted || '0min', color: COLORS.warning }
  ];

  mainMetrics.forEach((metric, i) => {
    const x = padding + i * (cardWidth + 10);
    
    ctx.fillStyle = COLORS.cardBg;
    roundRect(ctx, x, y, cardWidth, cardHeight, 12);
    ctx.fill();

    ctx.strokeStyle = metric.color + '40';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, cardWidth, cardHeight, 12);
    ctx.stroke();

    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = metric.color;
    ctx.textAlign = 'center';
    ctx.fillText(metric.value, x + cardWidth / 2, y + 40);

    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(metric.label, x + cardWidth / 2, y + 65);
  });

  y += cardHeight + 25;

  // Segunda linha de métricas
  const secondaryMetrics = [
    { label: 'Média/Dia', value: stats.avg_executions_per_day?.toString() || '0', color: COLORS.primaryLight },
    { label: 'Hoje', value: stats.today_executions?.toString() || '0', color: COLORS.success },
    { label: 'Em Andamento', value: stats.in_progress_executions?.toString() || '0', color: COLORS.warning },
    { label: 'Conformidade', value: `${stats.avg_conformity_rate || 0}%`, color: COLORS.accent }
  ];

  secondaryMetrics.forEach((metric, i) => {
    const x = padding + i * (cardWidth + 10);
    
    ctx.fillStyle = COLORS.cardBg;
    roundRect(ctx, x, y, cardWidth, cardHeight, 12);
    ctx.fill();

    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = metric.color;
    ctx.textAlign = 'center';
    ctx.fillText(metric.value, x + cardWidth / 2, y + 40);

    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(metric.label, x + cardWidth / 2, y + 65);
  });

  y += cardHeight + 30;

  // ============ TOP CHECKLISTS ============
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'left';
  ctx.fillText('📋 Checklists Mais Executados', padding, y);
  y += 20;

  const topChecklists = stats.top_checklists?.slice(0, 5) || [];
  if (topChecklists.length > 0) {
    const maxCount = Math.max(...topChecklists.map(c => c.execution_count), 1);
    
    topChecklists.forEach((checklist, i) => {
      const barWidth = ((checklist.execution_count / maxCount) * (width - padding * 2 - 100)) || 0;
      
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = COLORS.textLight;
      ctx.textAlign = 'left';
      const title = checklist.title.length > 30 ? checklist.title.substring(0, 27) + '...' : checklist.title;
      ctx.fillText(title, padding, y + 12);

      // Barra de fundo
      ctx.fillStyle = COLORS.border;
      roundRect(ctx, padding + 200, y, width - padding * 2 - 250, 18, 4);
      ctx.fill();

      // Barra de valor
      if (barWidth > 0) {
        const barGradient = ctx.createLinearGradient(padding + 200, y, padding + 200 + barWidth, y);
        barGradient.addColorStop(0, COLORS.primary);
        barGradient.addColorStop(1, COLORS.accent);
        ctx.fillStyle = barGradient;
        roundRect(ctx, padding + 200, y, Math.max(barWidth * 0.6, 4), 18, 4);
        ctx.fill();
      }

      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillStyle = COLORS.textWhite;
      ctx.textAlign = 'right';
      ctx.fillText(checklist.execution_count.toString(), width - padding, y + 12);

      y += 28;
    });
  } else {
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText('Nenhuma execução no período', padding, y + 10);
    y += 30;
  }

  y += 20;

  // ============ TOP COLABORADORES ============
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'left';
  ctx.fillText('👥 Top Colaboradores', padding, y);
  y += 20;

  const topUsers = stats.top_users?.slice(0, 5) || [];
  if (topUsers.length > 0) {
    const maxUserCount = Math.max(...topUsers.map(u => u.execution_count), 1);
    
    topUsers.forEach((user, i) => {
      const barWidth = ((user.execution_count / maxUserCount) * (width - padding * 2 - 100)) || 0;
      
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = COLORS.textLight;
      ctx.textAlign = 'left';
      const name = user.name.length > 25 ? user.name.substring(0, 22) + '...' : user.name;
      ctx.fillText(name, padding, y + 12);

      // Barra de fundo
      ctx.fillStyle = COLORS.border;
      roundRect(ctx, padding + 200, y, width - padding * 2 - 250, 18, 4);
      ctx.fill();

      // Barra de valor
      if (barWidth > 0) {
        const barGradient = ctx.createLinearGradient(padding + 200, y, padding + 200 + barWidth, y);
        barGradient.addColorStop(0, '#ec4899');
        barGradient.addColorStop(1, '#f472b6');
        ctx.fillStyle = barGradient;
        roundRect(ctx, padding + 200, y, Math.max(barWidth * 0.6, 4), 18, 4);
        ctx.fill();
      }

      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillStyle = COLORS.textWhite;
      ctx.textAlign = 'right';
      ctx.fillText(user.execution_count.toString(), width - padding, y + 12);

      y += 28;
    });
  } else {
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText('Nenhum colaborador no período', padding, y + 10);
    y += 30;
  }

  y += 20;

  // ============ EXECUÇÕES POR DIA DA SEMANA ============
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'left';
  ctx.fillText('📅 Execuções por Dia da Semana', padding, y);
  y += 25;

  const weekdayData = new Array(7).fill(0);
  stats.executions_by_weekday?.forEach(item => {
    weekdayData[item.weekday] = item.count;
  });
  const maxWeekday = Math.max(...weekdayData, 1);

  const weekdayBarWidth = (width - padding * 2 - 60) / 7;
  const weekdayBarMaxHeight = 80;

  WEEKDAYS.forEach((day, i) => {
    const x = padding + i * weekdayBarWidth + 30;
    const barHeight = (weekdayData[i] / maxWeekday) * weekdayBarMaxHeight;
    
    // Barra de fundo
    ctx.fillStyle = COLORS.border;
    roundRect(ctx, x, y + weekdayBarMaxHeight - barHeight, weekdayBarWidth - 10, barHeight || 4, 4);
    ctx.fill();

    // Barra colorida
    if (barHeight > 0) {
      const dayGradient = ctx.createLinearGradient(x, y + weekdayBarMaxHeight, x, y + weekdayBarMaxHeight - barHeight);
      dayGradient.addColorStop(0, COLORS.primary);
      dayGradient.addColorStop(1, COLORS.primaryLight);
      ctx.fillStyle = dayGradient;
      roundRect(ctx, x, y + weekdayBarMaxHeight - barHeight, weekdayBarWidth - 10, barHeight, 4);
      ctx.fill();
    }

    // Label do dia
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(day, x + (weekdayBarWidth - 10) / 2, y + weekdayBarMaxHeight + 15);

    // Valor
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillStyle = COLORS.textLight;
    ctx.fillText(weekdayData[i].toString(), x + (weekdayBarWidth - 10) / 2, y + weekdayBarMaxHeight - barHeight - 5);
  });

  y += weekdayBarMaxHeight + 40;

  // ============ HORÁRIOS DE EXECUÇÃO ============
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'left';
  ctx.fillText('⏰ Horários de Execução', padding, y);
  y += 25;

  const hourData = new Array(24).fill(0);
  stats.executions_by_hour?.forEach(item => {
    hourData[item.hour] = item.count;
  });
  const maxHour = Math.max(...hourData, 1);

  // Mostrar apenas horário comercial (6h às 22h)
  const hourBarWidth = (width - padding * 2) / 17;
  const hourBarMaxHeight = 60;

  for (let h = 6; h <= 22; h++) {
    const x = padding + (h - 6) * hourBarWidth;
    const barHeight = (hourData[h] / maxHour) * hourBarMaxHeight;
    
    // Barra
    if (barHeight > 0) {
      const hourGradient = ctx.createLinearGradient(x, y + hourBarMaxHeight, x, y + hourBarMaxHeight - barHeight);
      hourGradient.addColorStop(0, COLORS.accent);
      hourGradient.addColorStop(1, '#5eead4');
      ctx.fillStyle = hourGradient;
      roundRect(ctx, x + 2, y + hourBarMaxHeight - barHeight, hourBarWidth - 4, barHeight, 3);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.border;
      roundRect(ctx, x + 2, y + hourBarMaxHeight - 3, hourBarWidth - 4, 3, 2);
      ctx.fill();
    }

    // Label da hora (a cada 2 horas)
    if (h % 2 === 0) {
      ctx.font = '9px Arial, sans-serif';
      ctx.fillStyle = COLORS.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(`${h}h`, x + hourBarWidth / 2, y + hourBarMaxHeight + 12);
    }
  }

  y += hourBarMaxHeight + 40;

  // ============ RODAPÉ ============
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = COLORS.textDark;
  ctx.textAlign = 'center';
  ctx.fillText('Gerado automaticamente pelo CheckList App', width / 2, height - 30);

  return canvas.toBuffer('image/png');
}

/**
 * Desenha um retângulo arredondado
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default { generateReportImage };

