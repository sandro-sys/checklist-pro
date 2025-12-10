import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import { dbRunAsync, dbGetAsync, dbAllAsync } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Listar todos os usuários da empresa
router.get('/', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Usuário não vinculado a uma empresa' });
    }

    const users = await dbAllAsync(`
      SELECT u.id, u.email, u.name, u.phone, u.role_type, u.role_id, u.is_active, u.last_login, u.created_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.company_id = ?
      ORDER BY u.name
    `, [companyId]);

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Obter usuário por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await dbGetAsync(`
      SELECT u.id, u.email, u.name, u.phone, u.role_type, u.role_id, u.company_id, u.is_active, u.last_login, u.created_at,
             r.name as role_name,
             c.name as company_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se é da mesma empresa
    if (user.company_id !== req.user.company_id && req.user.role_type !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro ao obter usuário' });
  }
});

// Criar novo usuário (colaborador)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email, name, phone, password, role_id } = req.body;
    const companyId = req.user.company_id;

    // Validações
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Você precisa ter uma empresa para adicionar usuários' });
    }

    // Verificar se email já existe
    const existingUser = await dbGetAsync('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    // Gerar senha temporária se não fornecida
    const userPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(userPassword, 12);
    
    const userId = uuidv4();

    await dbRunAsync(`
      INSERT INTO users (id, email, password, name, phone, role_type, role_id, company_id, lgpd_consent, lgpd_consent_date)
      VALUES (?, ?, ?, ?, ?, 'user', ?, ?, 0, NULL)
    `, [userId, email.toLowerCase(), hashedPassword, name, phone || null, role_id || null, companyId]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'CREATE', 'user', ?, ?)
    `, [uuidv4(), req.user.id, userId, JSON.stringify({ name, email, created_by: req.user.name })]);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: { id: userId, email, name, phone },
      temporary_password: password ? null : userPassword // Só retorna se foi gerada automaticamente
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Atualizar usuário
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role_id, is_active } = req.body;

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar permissão
    if (user.company_id !== req.user.company_id && req.user.role_type !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await dbRunAsync(`
      UPDATE users 
      SET name = ?, phone = ?, role_id = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `, [
      name || user.name,
      phone !== undefined ? phone : user.phone,
      role_id !== undefined ? role_id : user.role_id,
      is_active !== undefined ? (is_active ? 1 : 0) : user.is_active,
      new Date().toISOString(),
      id
    ]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'UPDATE', 'user', ?, ?)
    `, [uuidv4(), req.user.id, id, JSON.stringify({ updated_fields: Object.keys(req.body) })]);

    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Alterar senha do usuário
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    // Só pode alterar a própria senha ou se for owner/admin
    if (id !== req.user.id && req.user.role_type !== 'owner' && req.user.role_type !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se for o próprio usuário, verificar senha atual
    if (id === req.user.id) {
      const validPassword = await bcrypt.compare(current_password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }
    }

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);

    await dbRunAsync('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [
      hashedPassword,
      new Date().toISOString(),
      id
    ]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'PASSWORD_CHANGE', 'user', ?, ?)
    `, [uuidv4(), req.user.id, id, JSON.stringify({ changed_by: req.user.name })]);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// Desativar/Ativar usuário
router.put('/:id/toggle-active', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar permissão
    if (user.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Não pode desativar o próprio usuário
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Você não pode desativar sua própria conta' });
    }

    const newStatus = user.is_active ? 0 : 1;

    await dbRunAsync('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?', [
      newStatus,
      new Date().toISOString(),
      id
    ]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, 'user', ?, ?)
    `, [uuidv4(), req.user.id, newStatus ? 'ACTIVATE' : 'DEACTIVATE', id, JSON.stringify({ user_name: user.name })]);

    res.json({ 
      message: newStatus ? 'Usuário ativado' : 'Usuário desativado',
      is_active: newStatus === 1
    });
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// Deletar usuário (soft delete - apenas desativa)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar permissão
    if (user.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Não pode deletar o próprio usuário
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
    }

    // Não pode deletar o owner da empresa
    const company = await dbGetAsync('SELECT owner_id FROM companies WHERE id = ?', [user.company_id]);
    if (company && company.owner_id === id) {
      return res.status(400).json({ error: 'Não é possível excluir o proprietário da empresa' });
    }

    // Soft delete
    await dbRunAsync('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      id
    ]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'DELETE', 'user', ?, ?)
    `, [uuidv4(), req.user.id, id, JSON.stringify({ user_name: user.name })]);

    res.json({ message: 'Usuário removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export default router;
