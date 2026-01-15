import express from 'express';
import { dbAllAsync, dbGetAsync, dbRunAsync, isProduction } from '../database/init.js';
import { authenticateToken, requireMaster } from '../middleware/auth.js';

const router = express.Router();

// Helper para queries de data compatíveis com SQLite e PostgreSQL
const dateSubtract = (days) => {
  if (isProduction) {
    return `NOW() - INTERVAL '${days} days'`;
  }
  return `datetime('now', '-${days} days')`;
};

const currentTimestamp = () => {
  if (isProduction) {
    return 'NOW()';
  }
  return "datetime('now')";
};

// Todas as rotas requerem autenticação e ser master
router.use(authenticateToken);
router.use(requireMaster);

// Dashboard geral - estatísticas da plataforma
router.get('/dashboard', async (req, res) => {
  try {
    // Queries básicas com tratamento individual
    let companiesCount = { count: 0 };
    let usersCount = { count: 0 };
    let checklistsCount = { count: 0 };
    let executionsCount = { count: 0 };
    let companiesByPlan = [];
    let activeUsers = { count: 0 };
    let recentExecutions = { count: 0 };
    let newCompanies = { count: 0 };
    let unreadMessages = { count: 0 };

    try {
      companiesCount = await dbGetAsync(`SELECT COUNT(*) as count FROM companies`) || { count: 0 };
    } catch (e) { console.error('Erro ao contar empresas:', e.message); }

    try {
      usersCount = await dbGetAsync(`SELECT COUNT(*) as count FROM users`) || { count: 0 };
    } catch (e) { console.error('Erro ao contar usuários:', e.message); }

    try {
      checklistsCount = await dbGetAsync(`SELECT COUNT(*) as count FROM checklists`) || { count: 0 };
    } catch (e) { console.error('Erro ao contar checklists:', e.message); }

    try {
      executionsCount = await dbGetAsync(`SELECT COUNT(*) as count FROM checklist_executions`) || { count: 0 };
    } catch (e) { console.error('Erro ao contar execuções:', e.message); }

    try {
      companiesByPlan = await dbAllAsync(`
        SELECT COALESCE(plan, 'trial') as plan, COUNT(*) as count 
        FROM companies 
        GROUP BY COALESCE(plan, 'trial')
      `) || [];
    } catch (e) { console.error('Erro ao buscar empresas por plano:', e.message); }

    try {
      // Usuários ativos - usar created_at se last_login não existir
      activeUsers = await dbGetAsync(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= ${dateSubtract(7)}
      `) || { count: 0 };
    } catch (e) { console.error('Erro ao contar usuários ativos:', e.message); }

    try {
      recentExecutions = await dbGetAsync(`
        SELECT COUNT(*) as count 
        FROM checklist_executions 
        WHERE created_at >= ${dateSubtract(7)}
      `) || { count: 0 };
    } catch (e) { console.error('Erro ao contar execuções recentes:', e.message); }

    try {
      newCompanies = await dbGetAsync(`
        SELECT COUNT(*) as count 
        FROM companies 
        WHERE created_at >= ${dateSubtract(30)}
      `) || { count: 0 };
    } catch (e) { console.error('Erro ao contar novas empresas:', e.message); }

    try {
      // Verificar se tabela contact_messages existe
      unreadMessages = await dbGetAsync(`
        SELECT COUNT(*) as count 
        FROM contact_messages 
        WHERE read_at IS NULL
      `) || { count: 0 };
    } catch (e) { 
      console.error('Erro ao contar mensagens (tabela pode não existir):', e.message);
      unreadMessages = { count: 0 };
    }
    
    res.json({
      total_companies: companiesCount?.count || 0,
      total_users: usersCount?.count || 0,
      total_checklists: checklistsCount?.count || 0,
      total_executions: executionsCount?.count || 0,
      companies_by_plan: companiesByPlan || [],
      active_users_7d: activeUsers?.count || 0,
      executions_7d: recentExecutions?.count || 0,
      new_companies_30d: newCompanies?.count || 0,
      unread_messages: unreadMessages?.count || 0
    });
  } catch (error) {
    console.error('Erro geral ao buscar dashboard admin:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas', details: error.message });
  }
});

// Listar todas as empresas
router.get('/companies', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', plan = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [];
    
    if (search) {
      whereClause += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.cnpj LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (plan) {
      whereClause += ` AND c.plan = ?`;
      params.push(plan);
    }
    
    const companies = await dbAllAsync(`
      SELECT 
        c.*,
        u.name as owner_name,
        u.email as owner_email,
        (SELECT COUNT(*) FROM users WHERE company_id = c.id) as users_count,
        (SELECT COUNT(*) FROM checklists WHERE company_id = c.id) as checklists_count,
        (SELECT COUNT(*) FROM checklist_executions ce 
         JOIN checklists ch ON ce.checklist_id = ch.id 
         WHERE ch.company_id = c.id) as executions_count
      FROM companies c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const totalResult = await dbGetAsync(`
      SELECT COUNT(*) as count 
      FROM companies c 
      WHERE ${whereClause}
    `, params);
    
    res.json({
      companies,
      total: totalResult?.count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((totalResult?.count || 0) / limit)
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
});

// Detalhes de uma empresa
router.get('/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const company = await dbGetAsync(`
      SELECT c.*, u.name as owner_name, u.email as owner_email
      FROM companies c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `, [companyId]);
    
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    // Usuários da empresa (sem last_login que pode não existir)
    let users = [];
    try {
      users = await dbAllAsync(`
        SELECT id, name, email, role_type, is_active, created_at
        FROM users
        WHERE company_id = ?
        ORDER BY created_at DESC
      `, [companyId]) || [];
    } catch (e) {
      console.error('Erro ao buscar usuários da empresa:', e.message);
    }
    
    // Checklists da empresa
    let checklists = [];
    try {
      checklists = await dbAllAsync(`
        SELECT id, title, periodicity, is_active, created_at
        FROM checklists
        WHERE company_id = ?
        ORDER BY created_at DESC
      `, [companyId]) || [];
    } catch (e) {
      console.error('Erro ao buscar checklists da empresa:', e.message);
    }
    
    // Estatísticas com queries separadas para evitar erro
    let totalExecutions = 0;
    let executions30d = 0;
    
    try {
      const totalResult = await dbGetAsync(`
        SELECT COUNT(*) as count FROM checklist_executions ce 
        JOIN checklists ch ON ce.checklist_id = ch.id 
        WHERE ch.company_id = ?
      `, [companyId]);
      totalExecutions = totalResult?.count || 0;
    } catch (e) {
      console.error('Erro ao contar execuções totais:', e.message);
    }
    
    try {
      const recentResult = await dbGetAsync(`
        SELECT COUNT(*) as count FROM checklist_executions ce 
        JOIN checklists ch ON ce.checklist_id = ch.id 
        WHERE ch.company_id = ? AND ce.created_at >= ${dateSubtract(30)}
      `, [companyId]);
      executions30d = recentResult?.count || 0;
    } catch (e) {
      console.error('Erro ao contar execuções 30d:', e.message);
    }
    
    res.json({
      company,
      users,
      checklists,
      stats: {
        total_executions: totalExecutions,
        executions_30d: executions30d
      }
    });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa', details: error.message });
  }
});

// Alterar plano de uma empresa
router.put('/companies/:companyId/plan', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { plan, plan_expires_at } = req.body;
    
    await dbRunAsync(`
      UPDATE companies 
      SET plan = ?, plan_expires_at = ?, updated_at = ${currentTimestamp()}
      WHERE id = ?
    `, [plan, plan_expires_at, companyId]);
    
    res.json({ success: true, message: 'Plano atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

// Listar todos os usuários
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [];
    
    if (search) {
      whereClause += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const users = await dbAllAsync(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role_type, u.is_active, 
        u.is_master, u.last_login, u.created_at,
        c.name as company_name, c.id as company_id
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id OR c.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const totalResult = await dbGetAsync(`
      SELECT COUNT(*) as count FROM users u WHERE ${whereClause}
    `, params);
    
    res.json({
      users,
      total: totalResult?.count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((totalResult?.count || 0) / limit)
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Ativar/desativar usuário
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;
    
    await dbRunAsync(`
      UPDATE users SET is_active = ?, updated_at = ${currentTimestamp()}
      WHERE id = ?
    `, [is_active ? 1 : 0, userId]);
    
    res.json({ success: true, message: is_active ? 'Usuário ativado' : 'Usuário desativado' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Tornar usuário master
router.put('/users/:userId/master', async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_master } = req.body;
    
    await dbRunAsync(`
      UPDATE users SET is_master = ?, updated_at = ${currentTimestamp()}
      WHERE id = ?
    `, [is_master ? 1 : 0, userId]);
    
    res.json({ success: true, message: is_master ? 'Usuário promovido a master' : 'Privilégios master removidos' });
  } catch (error) {
    console.error('Erro ao atualizar master:', error);
    res.status(500).json({ error: 'Erro ao atualizar privilégios master' });
  }
});

// Listar mensagens de contato
router.get('/messages', async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    if (unread_only === 'true') {
      whereClause += ' AND read_at IS NULL';
    }
    
    const messages = await dbAllAsync(`
      SELECT * FROM contact_messages
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    const totalResult = await dbGetAsync(`
      SELECT COUNT(*) as count FROM contact_messages WHERE ${whereClause}
    `);
    
    res.json({
      messages,
      total: totalResult?.count || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ error: 'Erro ao listar mensagens' });
  }
});

// Marcar mensagem como lida
router.put('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    await dbRunAsync(`
      UPDATE contact_messages SET read_at = ${currentTimestamp()}
      WHERE id = ?
    `, [messageId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
});

// Acessar como outra empresa (impersonar)
router.post('/impersonate/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const company = await dbGetAsync(`
      SELECT c.*, u.id as owner_user_id, u.email as owner_email
      FROM companies c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `, [companyId]);
    
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    // Retorna os dados necessários para o frontend simular o acesso
    res.json({
      success: true,
      company_id: company.id,
      company_name: company.name,
      owner_id: company.owner_user_id,
      message: 'Use esses dados para navegar como esta empresa'
    });
  } catch (error) {
    console.error('Erro ao impersonar:', error);
    res.status(500).json({ error: 'Erro ao acessar empresa' });
  }
});

// Estatísticas de execuções por período
router.get('/stats/executions', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFunc = isProduction ? 'DATE(created_at)' : 'DATE(created_at)';
    
    const executions = await dbAllAsync(`
      SELECT 
        ${dateFunc} as date,
        COUNT(*) as count
      FROM checklist_executions
      WHERE created_at >= ${dateSubtract(parseInt(days))}
      GROUP BY ${dateFunc}
      ORDER BY date ASC
    `);
    
    res.json({ executions });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Estatísticas de novos cadastros por período
router.get('/stats/signups', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFunc = isProduction ? 'DATE(created_at)' : 'DATE(created_at)';
    
    const users = await dbAllAsync(`
      SELECT 
        ${dateFunc} as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ${dateSubtract(parseInt(days))}
      GROUP BY ${dateFunc}
      ORDER BY date ASC
    `);
    
    const companies = await dbAllAsync(`
      SELECT 
        ${dateFunc} as date,
        COUNT(*) as count
      FROM companies
      WHERE created_at >= ${dateSubtract(parseInt(days))}
      GROUP BY ${dateFunc}
      ORDER BY date ASC
    `);
    
    res.json({ users, companies });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ==========================================
// MÉTRICAS DETALHADAS POR EMPRESA
// ==========================================

// Métricas detalhadas de uma empresa específica
router.get('/companies/:companyId/metrics', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { days = 30 } = req.query;
    
    // Execuções por dia
    const executionsByDay = await dbAllAsync(`
      SELECT 
        DATE(ce.created_at) as date,
        COUNT(*) as count
      FROM checklist_executions ce
      JOIN checklists ch ON ce.checklist_id = ch.id
      WHERE ch.company_id = ? AND ce.created_at >= ${dateSubtract(parseInt(days))}
      GROUP BY DATE(ce.created_at)
      ORDER BY date ASC
    `, [companyId]);
    
    // Taxa de conformidade média
    const conformityStats = await dbGetAsync(`
      SELECT 
        AVG(CASE WHEN er.is_checked = 1 THEN 100.0 ELSE 0 END) as avg_conformity
      FROM execution_responses er
      JOIN checklist_executions ce ON er.execution_id = ce.id
      JOIN checklists ch ON ce.checklist_id = ch.id
      WHERE ch.company_id = ? AND ce.created_at >= ${dateSubtract(parseInt(days))}
    `, [companyId]);
    
    // Checklists mais executados
    const topChecklists = await dbAllAsync(`
      SELECT 
        ch.id,
        ch.title,
        COUNT(ce.id) as executions_count
      FROM checklists ch
      LEFT JOIN checklist_executions ce ON ch.id = ce.checklist_id
      WHERE ch.company_id = ?
      GROUP BY ch.id, ch.title
      ORDER BY executions_count DESC
      LIMIT 5
    `, [companyId]);
    
    // Usuários mais ativos
    const topUsers = await dbAllAsync(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(ce.id) as executions_count
      FROM users u
      LEFT JOIN checklist_executions ce ON u.id = ce.executed_by
      JOIN checklists ch ON ce.checklist_id = ch.id
      WHERE ch.company_id = ?
      GROUP BY u.id, u.name, u.email
      ORDER BY executions_count DESC
      LIMIT 5
    `, [companyId]);
    
    // Execuções por hora do dia
    const hourExtract = isProduction ? 'EXTRACT(HOUR FROM ce.created_at)::INTEGER' : "CAST(strftime('%H', ce.created_at) AS INTEGER)";
    const executionsByHour = await dbAllAsync(`
      SELECT 
        ${hourExtract} as hour,
        COUNT(*) as count
      FROM checklist_executions ce
      JOIN checklists ch ON ce.checklist_id = ch.id
      WHERE ch.company_id = ? AND ce.created_at >= ${dateSubtract(parseInt(days))}
      GROUP BY ${hourExtract}
      ORDER BY hour ASC
    `, [companyId]);
    
    // Itens com mais não conformidades
    const nonConformItems = await dbAllAsync(`
      SELECT 
        ci.description,
        ch.title as checklist_title,
        COUNT(*) as non_conform_count
      FROM execution_responses er
      JOIN checklist_items ci ON er.item_id = ci.id
      JOIN checklist_executions ce ON er.execution_id = ce.id
      JOIN checklists ch ON ce.checklist_id = ch.id
      WHERE ch.company_id = ? AND er.is_checked = 0 AND er.is_not_applicable = 0
      GROUP BY ci.id
      ORDER BY non_conform_count DESC
      LIMIT 10
    `, [companyId]);
    
    res.json({
      executions_by_day: executionsByDay,
      avg_conformity: conformityStats?.avg_conformity || 0,
      top_checklists: topChecklists,
      top_users: topUsers,
      executions_by_hour: executionsByHour,
      non_conform_items: nonConformItems
    });
  } catch (error) {
    console.error('Erro ao buscar métricas da empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// ==========================================
// COPIAR CHECKLISTS ENTRE EMPRESAS
// ==========================================

// Listar checklists disponíveis para copiar
router.get('/checklists', async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    let whereClause = '1=1';
    const params = [];
    
    if (search) {
      whereClause += ` AND (ch.title LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const checklists = await dbAllAsync(`
      SELECT 
        ch.id,
        ch.title,
        ch.description,
        ch.periodicity,
        c.id as company_id,
        c.name as company_name,
        (SELECT COUNT(*) FROM checklist_items WHERE checklist_id = ch.id) as items_count
      FROM checklists ch
      JOIN companies c ON ch.company_id = c.id
      WHERE ${whereClause}
      ORDER BY ch.created_at DESC
      LIMIT 100
    `, params);
    
    res.json({ checklists });
  } catch (error) {
    console.error('Erro ao listar checklists:', error);
    res.status(500).json({ error: 'Erro ao listar checklists' });
  }
});

// Copiar checklist para outra empresa
router.post('/checklists/:checklistId/copy', async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { target_company_id } = req.body;
    
    console.log('Copiando checklist:', checklistId, 'para empresa:', target_company_id);
    
    if (!target_company_id) {
      return res.status(400).json({ error: 'Empresa de destino é obrigatória' });
    }
    
    // Buscar checklist original
    const originalChecklist = await dbGetAsync(`
      SELECT id, title, description, periodicity, schedule_time, schedule_days FROM checklists WHERE id = ?
    `, [checklistId]);
    
    if (!originalChecklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }
    
    console.log('Checklist original encontrado:', originalChecklist.title);
    
    // Buscar itens do checklist original
    const originalItems = await dbAllAsync(`
      SELECT id, description, is_required, order_index, item_type FROM checklist_items WHERE checklist_id = ? ORDER BY order_index
    `, [checklistId]) || [];
    
    console.log('Itens encontrados:', originalItems.length);
    
    // Gerar novo ID
    const { v4: uuidv4 } = await import('uuid');
    const newChecklistId = uuidv4();
    
    // Criar novo checklist com campos mínimos obrigatórios
    // Usar ? para que dbRunAsync converta automaticamente para $1, $2, etc no PostgreSQL
    await dbRunAsync(`
      INSERT INTO checklists (id, title, description, company_id, periodicity, is_active, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ${currentTimestamp()})
    `, [
      newChecklistId,
      `${originalChecklist.title} (Cópia)`,
      originalChecklist.description || '',
      target_company_id,
      originalChecklist.periodicity || 'daily',
      1,
      req.user.id
    ]);
    
    console.log('Checklist criado com ID:', newChecklistId);
    
    // Copiar itens
    for (const item of originalItems) {
      const newItemId = uuidv4();
      await dbRunAsync(`
        INSERT INTO checklist_items (id, checklist_id, description, is_required, order_index, item_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        newItemId, 
        newChecklistId, 
        item.description, 
        item.is_required || 0, 
        item.order_index || 0, 
        item.item_type || 'checkbox'
      ]);
    }
    
    console.log('Itens copiados com sucesso');
    
    // Buscar nome da empresa de destino
    const targetCompany = await dbGetAsync(`SELECT name FROM companies WHERE id = ?`, [target_company_id]);
    
    res.json({
      success: true,
      message: `Checklist copiado com sucesso para ${targetCompany?.name || 'empresa'}`,
      new_checklist_id: newChecklistId,
      items_copied: originalItems.length
    });
  } catch (error) {
    console.error('Erro ao copiar checklist:', error);
    res.status(500).json({ error: 'Erro ao copiar checklist', details: error.message });
  }
});

// ==========================================
// SISTEMA DE MENSAGENS DE SUPORTE
// ==========================================

// Listar todas as conversas de suporte (para master)
router.get('/support', async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;
    
    // Buscar conversas agrupadas por empresa
    const conversations = await dbAllAsync(`
      SELECT 
        c.id as company_id,
        c.name as company_name,
        u.name as user_name,
        u.email as user_email,
        sm.subject,
        sm.message,
        sm.created_at as last_message_at,
        sm.is_from_master,
        (SELECT COUNT(*) FROM support_messages WHERE company_id = c.id AND read_at IS NULL AND is_from_master = 0) as unread_count
      FROM support_messages sm
      JOIN companies c ON sm.company_id = c.id
      JOIN users u ON sm.user_id = u.id
      WHERE sm.id IN (
        SELECT MAX(id) FROM support_messages GROUP BY company_id
      )
      ${unread_only === 'true' ? 'HAVING unread_count > 0' : ''}
      ORDER BY sm.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    // Contar total de conversas não lidas
    const unreadTotal = await dbGetAsync(`
      SELECT COUNT(DISTINCT company_id) as count
      FROM support_messages
      WHERE read_at IS NULL AND is_from_master = 0
    `);
    
    res.json({
      conversations,
      unread_total: unreadTotal?.count || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Erro ao listar conversas de suporte:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

// Buscar mensagens de uma empresa específica
router.get('/support/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const messages = await dbAllAsync(`
      SELECT 
        sm.*,
        u.name as user_name,
        u.email as user_email
      FROM support_messages sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.company_id = ?
      ORDER BY sm.created_at ASC
    `, [companyId]);
    
    // Marcar mensagens da empresa como lidas
    await dbRunAsync(`
      UPDATE support_messages 
      SET read_at = ${currentTimestamp()}
      WHERE company_id = ? AND is_from_master = 0 AND read_at IS NULL
    `, [companyId]);
    
    // Buscar info da empresa
    const company = await dbGetAsync(`
      SELECT id, name, email FROM companies WHERE id = ?
    `, [companyId]);
    
    res.json({ messages, company });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem de suporte (master para empresa)
router.post('/support/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { subject, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }
    
    const { v4: uuidv4 } = await import('uuid');
    const messageId = uuidv4();
    
    await dbRunAsync(`
      INSERT INTO support_messages (id, company_id, user_id, subject, message, is_from_master, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ${currentTimestamp()})
    `, [messageId, companyId, req.user.id, subject || 'Resposta do Suporte', message]);
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      message_id: messageId
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

export default router;

