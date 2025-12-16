import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Gera uma imagem de comprovante do checklist
 * @param {Object} data - Dados do checklist executado
 * @returns {Buffer} - Buffer da imagem PNG
 */
export async function generateCertificateImage(data) {
  const {
    checklistTitle,
    companyName,
    executedBy,
    executedAt,
    items,
    totalItems,
    checkedItems,
    notApplicableItems,
    completionRate
  } = data;

  // Dimensões da imagem
  const width = 800;
  const padding = 40;
  const headerHeight = 220; // Header com badge e título
  const itemHeight = 45; // Altura de cada item
  const cardInfoHeight = 140; // Info do checklist dentro do card (título, empresa, data, etc)
  const resultCardsHeight = 100; // Cards de resultado (Concluídos, N/A, Conformidade)
  const progressBarHeight = 60; // Barra de progresso + texto
  const footerHeight = 60; // Rodapé
  
  // Calcular altura dinâmica baseada nos itens
  const itemsToShow = items.slice(0, 15); // Limitar a 15 itens na imagem
  const itemsHeight = itemsToShow.length * itemHeight + 40; // Items + label "ITENS"
  const moreItemsHeight = items.length > 15 ? 30 : 0; // Texto "+ X itens adicionais"
  
  const height = headerHeight + cardInfoHeight + itemsHeight + moreItemsHeight + resultCardsHeight + progressBarHeight + footerHeight + padding * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background com gradiente
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(0.5, '#151a21');
  gradient.addColorStop(1, COLORS.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Padrão decorativo de fundo
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let i = 0; i < height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }

  // ============ HEADER ============
  let y = padding;

  // Logo/Badge de conclusão
  const badgeSize = 70;
  const badgeX = width / 2;
  const badgeY = y + badgeSize / 2 + 10;

  // Círculo externo com gradiente
  const badgeGradient = ctx.createLinearGradient(
    badgeX - badgeSize/2, badgeY - badgeSize/2,
    badgeX + badgeSize/2, badgeY + badgeSize/2
  );
  badgeGradient.addColorStop(0, COLORS.primary);
  badgeGradient.addColorStop(1, COLORS.accent);
  
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeSize/2, 0, Math.PI * 2);
  ctx.fillStyle = badgeGradient;
  ctx.fill();

  // Checkmark
  ctx.strokeStyle = COLORS.textWhite;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(badgeX - 18, badgeY);
  ctx.lineTo(badgeX - 5, badgeY + 15);
  ctx.lineTo(badgeX + 20, badgeY - 12);
  ctx.stroke();

  y = badgeY + badgeSize/2 + 20;

  // Título "CHECKLIST CONCLUÍDO"
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'center';
  ctx.fillText('CHECKLIST CONCLUÍDO', width / 2, y);
  y += 15;

  // Subtítulo
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('CheckList App', width / 2, y + 20);
  y += 50;

  // ============ CARD PRINCIPAL ============
  const cardX = padding;
  const cardY = y;
  const cardWidth = width - padding * 2;
  const cardHeight = cardInfoHeight + itemsHeight + moreItemsHeight;

  // Card background
  ctx.fillStyle = COLORS.cardBg;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.fill();

  // Card border
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.stroke();

  y = cardY + 30;

  // Info do checklist
  ctx.textAlign = 'left';
  const infoX = cardX + 24;

  // Nome do checklist
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillStyle = COLORS.textWhite;
  ctx.fillText(truncateText(ctx, checklistTitle, cardWidth - 48), infoX, y);
  y += 30;

  // Empresa
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(`Empresa: ${companyName}`, infoX, y);
  y += 22;

  // Executado por
  ctx.fillText(`Executado por: ${executedBy}`, infoX, y);
  y += 22;

  // Data
  const dateStr = new Date(executedAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  ctx.fillText(`Data: ${dateStr}`, infoX, y);
  y += 35;

  // Linha divisória
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(infoX, y);
  ctx.lineTo(cardX + cardWidth - 24, y);
  ctx.stroke();
  y += 25;

  // ============ ITENS DO CHECKLIST ============
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('ITENS', infoX, y);
  y += 20;

  itemsToShow.forEach((item, index) => {
    const itemY = y + index * itemHeight;
    
    // Ícone de status
    const iconX = infoX + 12;
    const iconY = itemY + 10;
    
    if (item.is_checked) {
      // Checkmark verde
      ctx.beginPath();
      ctx.arc(iconX, iconY, 10, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.success;
      ctx.fill();
      
      ctx.strokeStyle = COLORS.textWhite;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(iconX - 4, iconY);
      ctx.lineTo(iconX - 1, iconY + 4);
      ctx.lineTo(iconX + 5, iconY - 3);
      ctx.stroke();
    } else if (item.is_not_applicable) {
      // N/A amarelo
      ctx.beginPath();
      ctx.arc(iconX, iconY, 10, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.warning;
      ctx.fill();
      
      ctx.strokeStyle = COLORS.textWhite;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(iconX - 5, iconY);
      ctx.lineTo(iconX + 5, iconY);
      ctx.stroke();
    } else {
      // Não marcado
      ctx.beginPath();
      ctx.arc(iconX, iconY, 10, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.textDark;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Texto do item
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = item.is_not_applicable ? COLORS.textDark : COLORS.textLight;
    ctx.textAlign = 'left';
    const itemText = truncateText(ctx, item.title, cardWidth - 100);
    ctx.fillText(itemText, infoX + 35, itemY + 14);

    // Badge de status
    if (item.is_required && !item.is_checked && !item.is_not_applicable) {
      ctx.font = '10px Arial, sans-serif';
      ctx.fillStyle = COLORS.danger;
      ctx.fillText('OBRIGATÓRIO', cardX + cardWidth - 90, itemY + 14);
    }
  });

  // Atualiza Y após os itens
  y = y + itemsToShow.length * itemHeight;

  // Se há mais itens
  if (items.length > 15) {
    y += 10;
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(`+ ${items.length - 15} itens adicionais`, width / 2, y);
  }

  // ============ RESULTADO/FOOTER ============
  y = cardY + cardHeight + 25;

  // Card de resultado
  const resultCardWidth = (cardWidth - 20) / 3;
  const resultCardHeight = 70;

  // Card 1 - Concluídos
  drawResultCard(ctx, cardX, y, resultCardWidth, resultCardHeight, 
    checkedItems.toString(), 'Concluídos', COLORS.success);

  // Card 2 - N/A
  drawResultCard(ctx, cardX + resultCardWidth + 10, y, resultCardWidth, resultCardHeight,
    notApplicableItems.toString(), 'N/A', COLORS.warning);

  // Card 3 - Taxa
  drawResultCard(ctx, cardX + (resultCardWidth + 10) * 2, y, resultCardWidth, resultCardHeight,
    `${completionRate}%`, 'Conformidade', COLORS.primary);

  y += resultCardHeight + 20;

  // Barra de progresso
  const progressBarWidth = cardWidth;
  const progressBarH = 12;
  
  // Background da barra
  ctx.fillStyle = COLORS.border;
  roundRect(ctx, cardX, y, progressBarWidth, progressBarH, 6);
  ctx.fill();

  // Progresso
  const progressWidth = (progressBarWidth * completionRate) / 100;
  if (progressWidth > 0) {
    const progressGradient = ctx.createLinearGradient(cardX, y, cardX + progressWidth, y);
    progressGradient.addColorStop(0, COLORS.primary);
    progressGradient.addColorStop(1, COLORS.accent);
    ctx.fillStyle = progressGradient;
    roundRect(ctx, cardX, y, progressWidth, progressBarH, 6);
    ctx.fill();
  }

  y += progressBarH + 15;

  // Texto de resumo
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(`${checkedItems + notApplicableItems} de ${totalItems} itens respondidos`, width / 2, y);

  // Rodapé
  y = height - 30;
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = COLORS.textDark;
  ctx.fillText('Gerado automaticamente pelo CheckList App', width / 2, y);

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

/**
 * Desenha um card de resultado
 */
function drawResultCard(ctx, x, y, width, height, value, label, color) {
  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  roundRect(ctx, x, y, width, height, 12);
  ctx.fill();

  // Border
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, width, height, 12);
  ctx.stroke();

  // Valor
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(value, x + width / 2, y + 35);

  // Label
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(label, x + width / 2, y + 55);
}

/**
 * Trunca texto para caber na largura especificada
 */
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export default { generateCertificateImage };

