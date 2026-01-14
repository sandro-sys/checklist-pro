import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbAllAsync, dbGetAsync, dbRunAsync, isProduction } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper para timestamp compatível
const currentTimestamp = () => isProduction ? 'NOW()' : "datetime('now')";

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar mensagens de suporte da empresa do usuário
router.get('/', async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Usuário não está associado a uma empresa' });
    }
    
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
    
    // Marcar mensagens do master como lidas
    await dbRunAsync(`
      UPDATE support_messages 
      SET read_at = ${currentTimestamp()}
      WHERE company_id = ? AND is_from_master = 1 AND read_at IS NULL
    `, [companyId]);
    
    // Contar mensagens não lidas do master
    const unreadCount = await dbGetAsync(`
      SELECT COUNT(*) as count 
      FROM support_messages 
      WHERE company_id = ? AND is_from_master = 1 AND read_at IS NULL
    `, [companyId]);
    
    res.json({ 
      messages,
      unread_count: unreadCount?.count || 0
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens de suporte:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem de suporte (empresa para master)
router.post('/', async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { subject, message } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Usuário não está associado a uma empresa' });
    }
    
    if (!subject || !message) {
      return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios' });
    }
    
    const messageId = uuidv4();
    
    await dbRunAsync(`
      INSERT INTO support_messages (id, company_id, user_id, subject, message, is_from_master, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ${currentTimestamp()})
    `, [messageId, companyId, req.user.id, subject, message]);
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso! O suporte responderá em breve.',
      message_id: messageId
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de suporte:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Contar mensagens não lidas do master
router.get('/unread', async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    if (!companyId) {
      return res.json({ unread_count: 0 });
    }
    
    const unreadCount = await dbGetAsync(`
      SELECT COUNT(*) as count 
      FROM support_messages 
      WHERE company_id = ? AND is_from_master = 1 AND read_at IS NULL
    `, [companyId]);
    
    res.json({ unread_count: unreadCount?.count || 0 });
  } catch (error) {
    console.error('Erro ao contar mensagens:', error);
    res.status(500).json({ error: 'Erro ao contar mensagens' });
  }
});

export default router;

