import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import { dbRun, dbGet, dbAll, saveDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, lgpd_consent } = req.body;

    // Validações
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
    }

    if (!lgpd_consent) {
      return res.status(400).json({ error: 'É necessário aceitar os termos de uso e política de privacidade' });
    }

    // Verificar se email já existe
    const existingUser = dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Inserir usuário
    dbRun(`
      INSERT INTO users (id, email, password, name, role_type, lgpd_consent, lgpd_consent_date)
      VALUES (?, ?, ?, ?, 'owner', 1, ?)
    `, [userId, email.toLowerCase(), hashedPassword, name, new Date().toISOString()]);

    // Log de auditoria
    dbRun(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'CREATE', 'user', ?, ?)
    `, [uuidv4(), userId, userId, JSON.stringify({ action: 'user_registration' })]);

    // Gerar tokens
    const accessToken = jwt.sign(
      { id: userId, email, name, role: 'owner' },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      { expiresIn: '7d' }
    );

    // Salvar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    dbRun(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), userId, refreshToken, expiresAt]);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: { id: userId, email, name, role: 'owner' },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = dbGet(`
      SELECT u.*, c.id as company_id, c.name as company_name 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id OR c.owner_id = u.id
      WHERE u.email = ?
    `, [email.toLowerCase()]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar tokens
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        company_id: user.company_id 
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      { expiresIn: '7d' }
    );

    // Salvar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    dbRun(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), user.id, refreshToken, expiresAt]);

    // Log de auditoria
    dbRun(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'LOGIN', 'user', ?, ?)
    `, [uuidv4(), user.id, user.id, JSON.stringify({ action: 'user_login' })]);

    res.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        company_id: user.company_id,
        company_name: user.company_name
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido' });
    }

    const storedToken = dbGet(`
      SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime('now')
    `, [refreshToken]);

    if (!storedToken) {
      return res.status(403).json({ error: 'Refresh token inválido ou expirado' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret', (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Refresh token inválido' });
      }

      const user = dbGet(`
        SELECT u.*, c.id as company_id 
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id OR c.owner_id = u.id
        WHERE u.id = ?
      `, [decoded.id]);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          company_id: user.company_id 
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '15m' }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(500).json({ error: 'Erro ao atualizar token' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      dbRun('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    // Log de auditoria
    dbRun(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'LOGOUT', 'user', ?, ?)
    `, [uuidv4(), req.user.id, req.user.id, JSON.stringify({ action: 'user_logout' })]);

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// Obter perfil do usuário
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = dbGet(`
      SELECT u.id, u.email, u.name, u.role_type, u.company_id, u.created_at,
             c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id OR c.owner_id = u.id
      WHERE u.id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
});

// Solicitar exclusão de dados (LGPD)
router.post('/request-deletion', authenticateToken, (req, res) => {
  try {
    // Log de auditoria
    dbRun(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'DELETION_REQUEST', 'user', ?, ?)
    `, [uuidv4(), req.user.id, req.user.id, JSON.stringify({ 
      action: 'data_deletion_request',
      requested_at: new Date().toISOString()
    })]);

    res.json({ 
      message: 'Solicitação de exclusão recebida. Seus dados serão removidos em até 30 dias conforme a LGPD.' 
    });
  } catch (error) {
    console.error('Erro na solicitação de exclusão:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

export default router;
