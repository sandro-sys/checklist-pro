import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import { dbRunAsync, dbGetAsync, dbAllAsync } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendPasswordReset } from '../services/emailService.js';

const router = express.Router();

// Funcao para validar senha forte
function validateStrongPassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Minimo 8 caracteres');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minuscula');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiuscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos um numero');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Pelo menos um caractere especial (!@#$%^&*...)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

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

    // Validar senha forte
    const passwordValidation = validateStrongPassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Senha fraca. Requisitos: ' + passwordValidation.errors.join(', ')
      });
    }

    if (!lgpd_consent) {
      return res.status(400).json({ error: 'É necessário aceitar os termos de uso e política de privacidade' });
    }

    // Verificar se email já existe
    const existingUser = await dbGetAsync('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Inserir usuário
    await dbRunAsync(`
      INSERT INTO users (id, email, password, name, role_type, lgpd_consent, lgpd_consent_date)
      VALUES (?, ?, ?, ?, 'owner', 1, ?)
    `, [userId, email.toLowerCase(), hashedPassword, name, new Date().toISOString()]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'CREATE', 'user', ?, ?)
    `, [uuidv4(), userId, userId, JSON.stringify({ action: 'user_registration' })]);

    // Gerar tokens
    const accessToken = jwt.sign(
      { id: userId, email, name, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Salvar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await dbRunAsync(`
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

    // [B6] Subquery evita duplicação de linha quando usuário tem company_id E é owner
    const user = await dbGetAsync(`
      SELECT u.*,
        COALESCE(u.company_id, (SELECT id   FROM companies WHERE owner_id = u.id LIMIT 1)) as company_id,
        COALESCE(
          (SELECT name FROM companies WHERE id = u.company_id LIMIT 1),
          (SELECT name FROM companies WHERE owner_id = u.id  LIMIT 1)
        ) as company_name
      FROM users u
      WHERE u.email = ?
    `, [email.toLowerCase()]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // [B4] Usar role_type (campo correto) — user.role era sempre undefined
    const roleType = user.role_type || 'user';

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleType,
        company_id: user.company_id,
        is_master: user.is_master === 1
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await dbRunAsync(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), user.id, refreshToken, expiresAt]);

    // [B5] Atualizar last_login
    await dbRunAsync(
      `UPDATE users SET last_login = ? WHERE id = ?`,
      [new Date().toISOString(), user.id]
    );

    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'LOGIN', 'user', ?, ?)
    `, [uuidv4(), user.id, user.id, JSON.stringify({ action: 'user_login' })]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleType,
        company_id: user.company_id,
        company_name: user.company_name,
        must_change_password: user.must_change_password === 1,
        is_master: user.is_master === 1
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Trocar senha
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    // Validar nova senha forte
    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Nova senha fraca. Requisitos: ' + passwordValidation.errors.join(', ')
      });
    }

    // Buscar usuario
    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Verificar se nova senha é diferente da atual
    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha e remover flag de troca obrigatoria
    await dbRunAsync(`
      UPDATE users SET password = ?, must_change_password = 0, updated_at = ?
      WHERE id = ?
    `, [hashedPassword, new Date().toISOString(), req.user.id]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'PASSWORD_CHANGE', 'user', ?, ?)
    `, [uuidv4(), req.user.id, req.user.id, JSON.stringify({ action: 'password_changed' })]);

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    res.status(500).json({ error: 'Erro ao trocar senha' });
  }
});

// Marcar usuários para trocar senha (owner = só sua empresa; master = toda a plataforma)
router.post('/force-password-change-all', authenticateToken, async (req, res) => {
  try {
    const isOwner = req.user.role_type === 'owner';
    if (!isOwner && !req.user.is_master) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    const PROTECTED_EMAIL = 'sandro@rhumarh.com';

    if (req.user.is_master) {
      // Master pode forçar em toda a plataforma, exceto conta master protegida
      await dbRunAsync(
        `UPDATE users SET must_change_password = 1 WHERE email != ? AND is_master = 0`,
        [PROTECTED_EMAIL]
      );
    } else {
      // Owner só pode forçar na própria empresa
      await dbRunAsync(
        `UPDATE users SET must_change_password = 1 WHERE company_id = ?`,
        [req.user.company_id]
      );
    }

    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'FORCE_PASSWORD_CHANGE', 'system', 'all', ?)
    `, [uuidv4(), req.user.id, JSON.stringify({ action: 'force_password_change_all_users', scope: req.user.is_master ? 'platform' : 'company' })]);

    res.json({ message: 'Usuários marcados para trocar a senha no próximo login.' });
  } catch (error) {
    console.error('Erro ao forçar troca de senha:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Solicitar recuperacao de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Buscar usuario pelo email
    const user = await dbGetAsync('SELECT id, name, email FROM users WHERE email = ?', [email.toLowerCase()]);

    // Sempre retornar sucesso para evitar enumeration attack
    if (!user) {
      return res.json({ 
        message: 'Se o email estiver cadastrado, você receberá um link para recuperação de senha.' 
      });
    }

    // Invalidar tokens anteriores do usuario
    await dbRunAsync('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    // Salvar token no banco
    await dbRunAsync(`
      INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `, [tokenId, user.id, resetToken, expiresAt]);

    // Gerar link de recuperacao
    const baseUrl = process.env.FRONTEND_URL || 'https://checklist-pro.rhumarh.com';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'PASSWORD_RESET_REQUEST', 'user', ?, ?)
    `, [uuidv4(), user.id, user.id, JSON.stringify({ action: 'password_reset_requested' })]);

    // Responder imediatamente ao usuario
    res.json({ 
      message: 'Se o email estiver cadastrado, você receberá um link para recuperação de senha.' 
    });

    // Enviar email em background (nao bloqueia a resposta)
    sendPasswordReset(user.email, {
      userName: user.name,
      resetLink,
      expiresIn: '1 hora'
    }).then(result => {
      if (result.success) {
        console.log('📧 Email de recuperação enviado para:', user.email);
      } else {
        console.error('❌ Erro ao enviar email de recuperação:', result.error);
      }
    }).catch(err => {
      console.error('❌ Erro ao enviar email de recuperação:', err);
    });

  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Redefinir senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    // Validar nova senha forte
    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Senha fraca. Requisitos: ' + passwordValidation.errors.join(', ')
      });
    }

    // Buscar token valido
    const resetToken = await dbGetAsync(`
      SELECT * FROM password_reset_tokens 
      WHERE token = ? AND used_at IS NULL AND expires_at > ?
    `, [token, new Date().toISOString()]);

    if (!resetToken) {
      return res.status(400).json({ error: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.' });
    }

    // Buscar usuario
    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [resetToken.user_id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await dbRunAsync(`
      UPDATE users SET password = ?, must_change_password = 0, updated_at = ?
      WHERE id = ?
    `, [hashedPassword, new Date().toISOString(), user.id]);

    // Marcar token como usado
    await dbRunAsync(`
      UPDATE password_reset_tokens SET used_at = ? WHERE id = ?
    `, [new Date().toISOString(), resetToken.id]);

    // Invalidar todos os refresh tokens do usuario (forcar novo login)
    await dbRunAsync('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'PASSWORD_RESET_COMPLETE', 'user', ?, ?)
    `, [uuidv4(), user.id, user.id, JSON.stringify({ action: 'password_reset_completed' })]);

    res.json({ message: 'Senha alterada com sucesso! Faça login com sua nova senha.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// Verificar se token de reset e valido
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token não fornecido' });
    }

    const resetToken = await dbGetAsync(`
      SELECT pt.*, u.email, u.name 
      FROM password_reset_tokens pt
      JOIN users u ON pt.user_id = u.id
      WHERE pt.token = ? AND pt.used_at IS NULL AND pt.expires_at > ?
    `, [token, new Date().toISOString()]);

    if (!resetToken) {
      return res.json({ valid: false, error: 'Link inválido ou expirado' });
    }

    res.json({ 
      valid: true, 
      email: resetToken.email,
      name: resetToken.name
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ valid: false, error: 'Erro ao verificar token' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido' });
    }

    // [B3] Comparação de data no lado da aplicação — evita NOW() que não existe no SQLite
    const storedToken = await dbGetAsync(
      `SELECT * FROM refresh_tokens WHERE token = ?`,
      [refreshToken]
    );

    if (!storedToken || new Date(storedToken.expires_at) <= new Date()) {
      return res.status(403).json({ error: 'Refresh token inválido ou expirado' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Refresh token inválido' });
      }

      try {
        // [B6] Subquery sem JOIN ambíguo
        const user = await dbGetAsync(`
          SELECT u.*,
            COALESCE(u.company_id, (SELECT id FROM companies WHERE owner_id = u.id LIMIT 1)) as company_id
          FROM users u
          WHERE u.id = ?
        `, [decoded.id]);

        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // [B7] Rotação do refresh token — invalida o antigo e emite um novo
        await dbRunAsync('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);

        const newRefreshToken = jwt.sign(
          { id: user.id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await dbRunAsync(
          `INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
          [uuidv4(), user.id, newRefreshToken, newExpiresAt]
        );

        // [B4] Usar role_type
        const roleType = user.role_type || 'user';

        const newAccessToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            role: roleType,
            company_id: user.company_id,
            is_master: user.is_master === 1
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        res.json({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: roleType,
            company_id: user.company_id,
            is_master: user.is_master === 1
          }
        });
      } catch (innerError) {
        console.error('Erro interno no refresh:', innerError);
        return res.status(500).json({ error: 'Erro ao atualizar token' });
      }
    });
  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(500).json({ error: 'Erro ao atualizar token' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await dbRunAsync('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    // Log de auditoria
    await dbRunAsync(`
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
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // [B6] Subquery sem JOIN ambíguo
    const user = await dbGetAsync(`
      SELECT u.id, u.email, u.name, u.role_type, u.company_id, u.is_master, u.created_at,
        COALESCE(
          (SELECT name FROM companies WHERE id = u.company_id LIMIT 1),
          (SELECT name FROM companies WHERE owner_id = u.id  LIMIT 1)
        ) as company_name
      FROM users u
      WHERE u.id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Converter is_master para boolean
    res.json({
      ...user,
      is_master: user.is_master === 1
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
});

// Solicitar exclusão de dados (LGPD)
router.post('/request-deletion', authenticateToken, async (req, res) => {
  try {
    // Log de auditoria
    await dbRunAsync(`
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
