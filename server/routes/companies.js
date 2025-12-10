import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { dbRun, dbGet, dbAll } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createDefaultRoles } from './roles.js';

const router = express.Router();

// Criar empresa
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, cnpj, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
    }

    const companyId = uuidv4();

    // Verificar se usuário já tem empresa
    const existingCompany = dbGet('SELECT id FROM companies WHERE owner_id = ?', [req.user.id]);
    if (existingCompany) {
      return res.status(400).json({ error: 'Você já possui uma empresa cadastrada' });
    }

    // Verificar CNPJ único (se fornecido)
    if (cnpj) {
      const existingCnpj = dbGet('SELECT id FROM companies WHERE cnpj = ?', [cnpj]);
      if (existingCnpj) {
        return res.status(400).json({ error: 'CNPJ já cadastrado' });
      }
    }

    dbRun(`
      INSERT INTO companies (id, name, cnpj, email, phone, address, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [companyId, name, cnpj || null, email || null, phone || null, address || null, req.user.id]);

    // Atualizar usuário com company_id e role_type owner
    dbRun('UPDATE users SET company_id = ?, role_type = ? WHERE id = ?', [companyId, 'owner', req.user.id]);

    // Criar categorias padrão
    const defaultCategories = [
      { name: 'Abertura', description: 'Checklists de abertura' },
      { name: 'Fechamento', description: 'Checklists de fechamento' },
      { name: 'Cozinha', description: 'Checklists de cozinha' },
      { name: 'Operação', description: 'Checklists operacionais' },
      { name: 'Limpeza', description: 'Checklists de limpeza' },
      { name: 'Segurança', description: 'Checklists de segurança' }
    ];

    for (const cat of defaultCategories) {
      dbRun(`
        INSERT INTO checklist_categories (id, name, description, company_id)
        VALUES (?, ?, ?, ?)
      `, [uuidv4(), cat.name, cat.description, companyId]);
    }

    // Criar cargos padrão
    createDefaultRoles(companyId);

    // Log de auditoria
    dbRun(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'CREATE', 'company', ?, ?)
    `, [uuidv4(), req.user.id, companyId, JSON.stringify({ name })]);

    res.status(201).json({
      message: 'Empresa criada com sucesso',
      company: { id: companyId, name, cnpj, email, phone, address }
    });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// Obter empresa do usuário
router.get('/my-company', authenticateToken, (req, res) => {
  try {
    const company = dbGet(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM checklists WHERE company_id = c.id) as total_checklists,
             (SELECT COUNT(*) FROM users WHERE company_id = c.id) as total_users
      FROM companies c
      WHERE c.owner_id = ? OR c.id = ?
    `, [req.user.id, req.user.company_id || '']);

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(company);
  } catch (error) {
    console.error('Erro ao obter empresa:', error);
    res.status(500).json({ error: 'Erro ao obter empresa' });
  }
});

// Atualizar empresa - BLOQUEADO (empresa não pode ser editada após criação)
router.put('/:id', authenticateToken, (req, res) => {
  return res.status(403).json({ 
    error: 'Não é possível editar os dados da empresa após o cadastro. Entre em contato com o suporte se precisar de alterações.' 
  });
});

// Listar categorias da empresa
router.get('/:id/categories', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const categories = dbAll(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM checklists WHERE category_id = c.id) as total_checklists
      FROM checklist_categories c
      WHERE c.company_id = ?
      ORDER BY c.name
    `, [id]);

    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Criar categoria
router.post('/:id/categories', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const categoryId = uuidv4();

    dbRun(`
      INSERT INTO checklist_categories (id, name, description, icon, company_id)
      VALUES (?, ?, ?, ?, ?)
    `, [categoryId, name, description || null, icon || '📋', id]);

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      category: { id: categoryId, name, description, icon: icon || '📋' }
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Adicionar usuário à empresa
router.post('/:id/users', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    // Verificar se é dono da empresa
    const company = dbGet('SELECT * FROM companies WHERE id = ?', [id]);
    if (!company || company.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    // Verificar se usuário já existe
    let user = dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    
    if (user) {
      // Atualizar company_id do usuário existente
      dbRun('UPDATE users SET company_id = ?, role = ? WHERE id = ?', [id, role || 'user', user.id]);
    } else {
      // Criar usuário com senha temporária
      const userId = uuidv4();
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      dbRun(`
        INSERT INTO users (id, email, password, name, role, company_id, lgpd_consent, lgpd_consent_date)
        VALUES (?, ?, ?, ?, ?, ?, 0, NULL)
      `, [userId, email.toLowerCase(), hashedPassword, name, role || 'user', id]);

      user = { id: userId, email, name, tempPassword };
    }

    res.status(201).json({
      message: 'Usuário adicionado com sucesso',
      user: { email: user.email, name: user.name || name }
    });
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
    res.status(500).json({ error: 'Erro ao adicionar usuário' });
  }
});

// Listar usuários da empresa
router.get('/:id/users', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const users = dbAll(`
      SELECT id, email, name, role, created_at
      FROM users
      WHERE company_id = ?
      ORDER BY name
    `, [id]);

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

export default router;
