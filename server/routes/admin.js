import express from 'express';
import { dbAllAsync, dbGetAsync, dbRunAsync } from '../database/init.js';
import { authenticateToken, requireMaster } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação e ser master
router.use(authenticateToken);
router.use(requireMaster);

// Dashboard geral - estatísticas da plataforma
router.get('/dashboard', async (req, res) => {
  try {
    // Total de empresas
    const companiesCount = await dbGetAsync(`SELECT COUNT(*) as count FROM companies`);
    
    // Total de usuários
    const usersCount = await dbGetAsync(`SELECT COUNT(*) as count FROM users`);
    
    // Total de checklists
    const checklistsCount = await dbGetAsync(`SELECT COUNT(*) as count FROM checklists`);
    
    // Total de execuções
    const executionsCount = await dbGetAsync(`SELECT COUNT(*) as count FROM checklist_executions`);
    
    // Empresas por plano
    const companiesByPlan = await dbAllAsync(`
      SELECT plan, COUNT(*) as count 
      FROM companies 
      GROUP BY plan
    `);
    
    // Usuários ativos nos últimos 7 dias
    const activeUsers = await dbGetAsync(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE last_login >= datetime('now', '-7 days')
    `);
    
    // Execuções nos últimos 7 dias
    const recentExecutions = await dbGetAsync(`
      SELECT COUNT(*) as count 
      FROM checklist_executions 
      WHERE created_at >= datetime('now', '-7 days')
    `);
    
    // Novas empresas nos últimos 30 dias
    const newCompanies = await dbGetAsync(`
      SELECT COUNT(*) as count 
      FROM companies 
      WHERE created_at >= datetime('now', '-30 days')
    `);
    
    // Mensagens de contato não lidas
    const unreadMessages = await dbGetAsync(`
      SELECT COUNT(*) as count 
      FROM contact_messages 
      WHERE read_at IS NULL
    `);
    
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
    console.error('Erro ao buscar dashboard admin:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
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
    
    // Usuários da empresa
    const users = await dbAllAsync(`
      SELECT id, name, email, role_type, is_active, last_login, created_at
      FROM users
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, [companyId]);
    
    // Checklists da empresa
    const checklists = await dbAllAsync(`
      SELECT id, title, periodicity, is_active, created_at
      FROM checklists
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, [companyId]);
    
    // Estatísticas
    const stats = await dbGetAsync(`
      SELECT 
        (SELECT COUNT(*) FROM checklist_executions ce 
         JOIN checklists ch ON ce.checklist_id = ch.id 
         WHERE ch.company_id = ?) as total_executions,
        (SELECT COUNT(*) FROM checklist_executions ce 
         JOIN checklists ch ON ce.checklist_id = ch.id 
         WHERE ch.company_id = ? AND ce.created_at >= datetime('now', '-30 days')) as executions_30d
    `, [companyId, companyId]);
    
    res.json({
      company,
      users,
      checklists,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// Alterar plano de uma empresa
router.put('/companies/:companyId/plan', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { plan, plan_expires_at } = req.body;
    
    await dbRunAsync(`
      UPDATE companies 
      SET plan = ?, plan_expires_at = ?, updated_at = datetime('now')
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
      UPDATE users SET is_active = ?, updated_at = datetime('now')
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
      UPDATE users SET is_master = ?, updated_at = datetime('now')
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
      UPDATE contact_messages SET read_at = datetime('now')
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
    
    const executions = await dbAllAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM checklist_executions
      WHERE created_at >= datetime('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at)
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
    
    const users = await dbAllAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    const companies = await dbAllAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM companies
      WHERE created_at >= datetime('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    res.json({ users, companies });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;

