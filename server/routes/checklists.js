import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { dbRunAsync, dbGetAsync, dbAllAsync, withTransaction } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Templates sugeridos para checklists
const CHECKLIST_TEMPLATES = {
  'abertura_casa': {
    title: 'Abertura da Casa',
    description: 'Checklist para abertura do estabelecimento',
    periodicity: 'daily',
    schedule_time: '06:00',
    items: [
      { title: 'Verificar iluminação externa', is_required: true },
      { title: 'Ligar ar condicionado/ventilação', is_required: true },
      { title: 'Verificar limpeza do salão', is_required: true },
      { title: 'Conferir mesas e cadeiras', is_required: true },
      { title: 'Verificar banheiros', is_required: true },
      { title: 'Ligar equipamentos de som', is_required: false },
      { title: 'Verificar estoque de guardanapos e talheres', is_required: true }
    ]
  },
  'fechamento_casa': {
    title: 'Fechamento da Casa',
    description: 'Checklist para fechamento do estabelecimento',
    periodicity: 'daily',
    schedule_time: '23:00',
    items: [
      { title: 'Verificar se todos os clientes saíram', is_required: true },
      { title: 'Fechar caixa', is_required: true },
      { title: 'Desligar equipamentos', is_required: true },
      { title: 'Verificar portas e janelas', is_required: true },
      { title: 'Ativar alarme', is_required: true },
      { title: 'Apagar todas as luzes', is_required: true }
    ]
  },
  'abertura_cozinha': {
    title: 'Abertura de Cozinha',
    description: 'Checklist para abertura da cozinha',
    periodicity: 'daily',
    schedule_time: '07:00',
    items: [
      { title: 'Verificar temperatura das geladeiras', is_required: true },
      { title: 'Verificar validade dos produtos', is_required: true },
      { title: 'Ligar fogões e fornos', is_required: true },
      { title: 'Verificar estoque de ingredientes', is_required: true },
      { title: 'Higienizar bancadas', is_required: true },
      { title: 'Verificar EPIs da equipe', is_required: true }
    ]
  },
  'fechamento_cozinha': {
    title: 'Fechamento de Cozinha',
    description: 'Checklist para fechamento da cozinha',
    periodicity: 'daily',
    schedule_time: '22:00',
    items: [
      { title: 'Desligar fogões e fornos', is_required: true },
      { title: 'Guardar alimentos corretamente', is_required: true },
      { title: 'Limpar bancadas e equipamentos', is_required: true },
      { title: 'Verificar temperatura das geladeiras', is_required: true },
      { title: 'Retirar lixo', is_required: true },
      { title: 'Verificar fechamento do gás', is_required: true }
    ]
  },
  'montagem_operacao': {
    title: 'Montagem de Operação',
    description: 'Checklist para montagem da operação diária',
    periodicity: 'daily',
    schedule_time: '09:00',
    items: [
      { title: 'Montar mise en place', is_required: true },
      { title: 'Verificar uniformes da equipe', is_required: true },
      { title: 'Conferir cardápio do dia', is_required: true },
      { title: 'Preparar molhos e acompanhamentos', is_required: true },
      { title: 'Verificar reservas do dia', is_required: false }
    ]
  },
  'fechamento_operacao': {
    title: 'Fechamento de Operação',
    description: 'Checklist para fechamento da operação',
    periodicity: 'daily',
    schedule_time: '21:00',
    items: [
      { title: 'Finalizar pedidos pendentes', is_required: true },
      { title: 'Guardar mise en place', is_required: true },
      { title: 'Registrar perdas do dia', is_required: true },
      { title: 'Preparar lista de compras', is_required: false },
      { title: 'Briefing com equipe', is_required: false }
    ]
  }
};

// Obter templates disponíveis
router.get('/templates', authenticateToken, (req, res) => {
  const templates = Object.entries(CHECKLIST_TEMPLATES).map(([key, value]) => ({
    id: key,
    title: value.title,
    description: value.description,
    periodicity: value.periodicity,
    items_count: value.items.length
  }));
  res.json(templates);
});

// Obter template específico
router.get('/templates/:templateId', authenticateToken, (req, res) => {
  const template = CHECKLIST_TEMPLATES[req.params.templateId];
  if (!template) {
    return res.status(404).json({ error: 'Template não encontrado' });
  }
  res.json({ id: req.params.templateId, ...template });
});

// Sugerir periodicidade baseado no título
router.post('/suggest-periodicity', authenticateToken, (req, res) => {
  const { title } = req.body;
  const titleLower = title.toLowerCase();

  let suggestion = {
    periodicity: 'daily',
    schedule_time: '08:00',
    schedule_days: null
  };

  if (titleLower.includes('abertura')) {
    suggestion.schedule_time = '06:00';
  } else if (titleLower.includes('fechamento')) {
    suggestion.schedule_time = '22:00';
  } else if (titleLower.includes('semanal') || titleLower.includes('semana')) {
    suggestion.periodicity = 'weekly';
    suggestion.schedule_days = JSON.stringify(['monday']);
  } else if (titleLower.includes('mensal') || titleLower.includes('mês')) {
    suggestion.periodicity = 'monthly';
  } else if (titleLower.includes('turno')) {
    suggestion.periodicity = 'shift';
  }

  res.json(suggestion);
});

// Criar checklist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      periodicity,
      schedule_time,
      schedule_days,
      items,
      template_id
    } = req.body;

    // [S5] company_id sempre vem do token, nunca do body
    const company_id = req.user.company_id;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    if (!company_id) {
      return res.status(400).json({ error: 'Usuário não vinculado a uma empresa' });
    }

    const checklistId = uuidv4();

    // Se usar template, pegar itens do template
    let checklistItems = items;
    let checklistData = { title, description, periodicity, schedule_time };

    if (template_id && CHECKLIST_TEMPLATES[template_id]) {
      const template = CHECKLIST_TEMPLATES[template_id];
      checklistItems = template.items;
      checklistData = {
        title: title || template.title,
        description: description || template.description,
        periodicity: periodicity || template.periodicity,
        schedule_time: schedule_time || template.schedule_time
      };
    }

    // Gerar QR Code (fora da transação — não é operação de banco)
    const qrCodeUrl = `${process.env.FRONTEND_URL || 'https://checklist-pro.onrender.com'}/execute/${checklistId}`;
    const qrCode = await QRCode.toDataURL(qrCodeUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    // [B2] Inserir checklist e itens em transação atômica
    await withTransaction(async (txn) => {
      await txn.run(`
        INSERT INTO checklists (id, title, description, category_id, company_id, periodicity, schedule_time, schedule_days, qr_code, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        checklistId,
        checklistData.title,
        checklistData.description || null,
        category_id || null,
        company_id,
        checklistData.periodicity || 'daily',
        checklistData.schedule_time || null,
        schedule_days ? JSON.stringify(schedule_days) : null,
        qrCode,
        req.user.id
      ]);

      if (checklistItems && checklistItems.length > 0) {
        for (let index = 0; index < checklistItems.length; index++) {
          const item = checklistItems[index];
          await txn.run(`
            INSERT INTO checklist_items (id, checklist_id, title, description, order_index, is_required, item_type, options)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(),
            checklistId,
            item.title,
            item.description || null,
            index,
            item.is_required ? 1 : 0,
            item.item_type || 'checkbox',
            item.options ? JSON.stringify(item.options) : null
          ]);
        }
      }
    });

    // Log de auditoria (fora da transação — falha não deve reverter o checklist)
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'CREATE', 'checklist', ?, ?)
    `, [uuidv4(), req.user.id, checklistId, JSON.stringify({ title: checklistData.title })]);

    res.status(201).json({
      message: 'Checklist criado com sucesso',
      checklist: {
        id: checklistId,
        ...checklistData,
        qr_code: qrCode,
        items_count: checklistItems?.length || 0
      }
    });
  } catch (error) {
    console.error('Erro ao criar checklist:', error);
    res.status(500).json({ error: 'Erro ao criar checklist' });
  }
});

// Listar checklists da empresa
router.get('/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { category_id, is_active } = req.query;

    let query = `
      SELECT c.*, 
             cat.name as category_name,
             cat.icon as category_icon,
             u.name as created_by_name,
             (SELECT COUNT(*) FROM checklist_items WHERE checklist_id = c.id) as items_count,
             (SELECT COUNT(*) FROM checklist_executions WHERE checklist_id = c.id) as executions_count
      FROM checklists c
      LEFT JOIN checklist_categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.company_id = ?
    `;
    
    const params = [companyId];

    if (category_id) {
      query += ' AND c.category_id = ?';
      params.push(category_id);
    }

    if (is_active !== undefined) {
      query += ' AND c.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY c.created_at DESC';

    const checklists = await dbAllAsync(query, params);
    res.json(checklists);
  } catch (error) {
    console.error('Erro ao listar checklists:', error);
    res.status(500).json({ error: 'Erro ao listar checklists' });
  }
});

// Obter checklist por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const checklist = await dbGetAsync(`
      SELECT c.*,
             cat.name as category_name,
             cat.icon as category_icon,
             u.name as created_by_name
      FROM checklists c
      LEFT JOIN checklist_categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `, [id]);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    // [S6] Verificar propriedade — apenas da própria empresa ou master
    if (checklist.company_id !== req.user.company_id && !req.user.is_master) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const items = await dbAllAsync(`
      SELECT * FROM checklist_items
      WHERE checklist_id = ?
      ORDER BY order_index
    `, [id]);

    res.json({ ...checklist, items });
  } catch (error) {
    console.error('Erro ao obter checklist:', error);
    res.status(500).json({ error: 'Erro ao obter checklist' });
  }
});

// Obter checklist por ID (público - para QR Code)
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checklist = await dbGetAsync(`
      SELECT c.id, c.title, c.description, c.periodicity,
             cat.name as category_name,
             cat.icon as category_icon,
             comp.name as company_name
      FROM checklists c
      LEFT JOIN checklist_categories cat ON c.category_id = cat.id
      LEFT JOIN companies comp ON c.company_id = comp.id
      WHERE c.id = ? AND c.is_active = 1
    `, [id]);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    const items = await dbAllAsync(`
      SELECT id, title, description, is_required, item_type, options
      FROM checklist_items 
      WHERE checklist_id = ? 
      ORDER BY order_index
    `, [id]);

    res.json({ ...checklist, items });
  } catch (error) {
    console.error('Erro ao obter checklist público:', error);
    res.status(500).json({ error: 'Erro ao obter checklist' });
  }
});

// Atualizar checklist
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, periodicity, schedule_time, schedule_days, is_active, items } = req.body;

    const checklist = await dbGetAsync('SELECT * FROM checklists WHERE id = ?', [id]);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    // [S6] Verificar propriedade
    if (checklist.company_id !== req.user.company_id && !req.user.is_master) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Atualizar metadados do checklist
    await dbRunAsync(`
      UPDATE checklists
      SET title = ?, description = ?, category_id = ?, periodicity = ?,
          schedule_time = ?, schedule_days = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `, [
      title || checklist.title,
      description !== undefined ? description : checklist.description,
      category_id !== undefined ? category_id : checklist.category_id,
      periodicity || checklist.periodicity,
      schedule_time !== undefined ? schedule_time : checklist.schedule_time,
      schedule_days ? JSON.stringify(schedule_days) : checklist.schedule_days,
      is_active !== undefined ? (is_active ? 1 : 0) : checklist.is_active,
      new Date().toISOString(),
      id
    ]);

    // [B1] DELETE + INSERT de itens em transação atômica — evita checklist sem itens
    if (items && Array.isArray(items)) {
      await withTransaction(async (txn) => {
        await txn.run('DELETE FROM checklist_items WHERE checklist_id = ?', [id]);

        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          await txn.run(`
            INSERT INTO checklist_items (id, checklist_id, title, description, order_index, is_required, item_type, options)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            item.id || uuidv4(),
            id,
            item.title,
            item.description || null,
            index,
            item.is_required ? 1 : 0,
            item.item_type || 'checkbox',
            item.options ? JSON.stringify(item.options) : null
          ]);
        }
      });
    }

    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'UPDATE', 'checklist', ?, ?)
    `, [uuidv4(), req.user.id, id, JSON.stringify({ updated_fields: Object.keys(req.body) })]);

    res.json({ message: 'Checklist atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    res.status(500).json({ error: 'Erro ao atualizar checklist' });
  }
});

// Deletar checklist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const checklist = await dbGetAsync('SELECT * FROM checklists WHERE id = ?', [id]);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    // [S6] Verificar propriedade
    if (checklist.company_id !== req.user.company_id && !req.user.is_master) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Soft delete - apenas desativa
    await dbRunAsync('UPDATE checklists SET is_active = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), id]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'DELETE', 'checklist', ?, ?)
    `, [uuidv4(), req.user.id, id, JSON.stringify({ title: checklist.title })]);

    res.json({ message: 'Checklist removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar checklist:', error);
    res.status(500).json({ error: 'Erro ao deletar checklist' });
  }
});

// Regenerar QR Code
router.post('/:id/regenerate-qrcode', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const qrCodeUrl = `${process.env.FRONTEND_URL || 'https://checklist-pro.onrender.com'}/execute/${id}`;
    const qrCode = await QRCode.toDataURL(qrCodeUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    await dbRunAsync('UPDATE checklists SET qr_code = ?, updated_at = ? WHERE id = ?', [qrCode, new Date().toISOString(), id]);

    res.json({ qr_code: qrCode });
  } catch (error) {
    console.error('Erro ao regenerar QR Code:', error);
    res.status(500).json({ error: 'Erro ao regenerar QR Code' });
  }
});

export default router;
