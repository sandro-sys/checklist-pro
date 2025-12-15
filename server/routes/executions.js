import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRunAsync, dbGetAsync, dbAllAsync } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateCertificateImage } from '../services/certificateService.js';
import { sendChecklistCertificate } from '../services/emailService.js';

const router = express.Router();

// Iniciar execução de checklist
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { checklist_id } = req.body;

    if (!checklist_id) {
      return res.status(400).json({ error: 'ID do checklist é obrigatório' });
    }

    // Verificar se checklist existe e está ativo
    const checklist = await dbGetAsync('SELECT * FROM checklists WHERE id = ? AND is_active = 1', [checklist_id]);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado ou inativo' });
    }

    // Verificar se já existe execução em andamento
    const existingExecution = await dbGetAsync(`
      SELECT * FROM checklist_executions 
      WHERE checklist_id = ? AND executed_by = ? AND status = 'in_progress'
    `, [checklist_id, req.user.id]);

    if (existingExecution) {
      return res.json({
        message: 'Execução já em andamento',
        execution: existingExecution
      });
    }

    const executionId = uuidv4();

    await dbRunAsync(`
      INSERT INTO checklist_executions (id, checklist_id, executed_by, status)
      VALUES (?, ?, ?, 'in_progress')
    `, [executionId, checklist_id, req.user.id]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'START_EXECUTION', 'execution', ?, ?)
    `, [uuidv4(), req.user.id, executionId, JSON.stringify({ checklist_id })]);

    res.status(201).json({
      message: 'Execução iniciada',
      execution: {
        id: executionId,
        checklist_id,
        status: 'in_progress',
        executed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao iniciar execução:', error);
    res.status(500).json({ error: 'Erro ao iniciar execução' });
  }
});

// Salvar resposta de item
router.post('/:executionId/responses', authenticateToken, async (req, res) => {
  try {
    const { executionId } = req.params;
    const { item_id, response, is_checked, is_not_applicable, notes } = req.body;

    if (!item_id) {
      return res.status(400).json({ error: 'ID do item é obrigatório' });
    }

    // Verificar se execução existe
    const execution = await dbGetAsync('SELECT * FROM checklist_executions WHERE id = ?', [executionId]);
    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }

    // Verificar se já existe resposta para este item
    const existingResponse = await dbGetAsync(`
      SELECT * FROM execution_responses WHERE execution_id = ? AND item_id = ?
    `, [executionId, item_id]);

    if (existingResponse) {
      // Atualizar resposta existente
      await dbRunAsync(`
        UPDATE execution_responses 
        SET response = ?, is_checked = ?, is_not_applicable = ?, notes = ?, responded_at = ?
        WHERE id = ?
      `, [response || null, is_checked ? 1 : 0, is_not_applicable ? 1 : 0, notes || null, new Date().toISOString(), existingResponse.id]);
    } else {
      // Criar nova resposta
      await dbRunAsync(`
        INSERT INTO execution_responses (id, execution_id, item_id, response, is_checked, is_not_applicable, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), executionId, item_id, response || null, is_checked ? 1 : 0, is_not_applicable ? 1 : 0, notes || null]);
    }

    res.json({ message: 'Resposta salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    res.status(500).json({ error: 'Erro ao salvar resposta' });
  }
});

// Finalizar execução
router.post('/:executionId/complete', authenticateToken, async (req, res) => {
  try {
    const { executionId } = req.params;
    const { notes } = req.body;

    const execution = await dbGetAsync('SELECT * FROM checklist_executions WHERE id = ?', [executionId]);
    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }

    // Verificar se todos os itens obrigatórios foram respondidos
    const requiredItems = await dbAllAsync(`
      SELECT ci.id 
      FROM checklist_items ci
      WHERE ci.checklist_id = ? AND ci.is_required = 1
    `, [execution.checklist_id]);

    // Buscar respostas marcadas como checked OU como não aplicável
    const responses = await dbAllAsync(`
      SELECT item_id FROM execution_responses 
      WHERE execution_id = ? AND (is_checked = 1 OR is_not_applicable = 1)
    `, [executionId]);

    const respondedItemIds = responses.map(r => r.item_id);
    const missingRequired = requiredItems.filter(item => !respondedItemIds.includes(item.id));

    if (missingRequired.length > 0) {
      return res.status(400).json({ 
        error: 'Existem itens obrigatórios não marcados',
        missing_count: missingRequired.length
      });
    }

    // Finalizar execução
    await dbRunAsync(`
      UPDATE checklist_executions 
      SET status = 'completed', completed_at = ?, notes = ?
      WHERE id = ?
    `, [new Date().toISOString(), notes || null, executionId]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'COMPLETE_EXECUTION', 'execution', ?, ?)
    `, [uuidv4(), req.user.id, executionId, JSON.stringify({ checklist_id: execution.checklist_id })]);

    res.json({ message: 'Checklist finalizado com sucesso' });
  } catch (error) {
    console.error('Erro ao finalizar execução:', error);
    res.status(500).json({ error: 'Erro ao finalizar execução' });
  }
});

// Obter execução por ID
router.get('/:executionId', authenticateToken, async (req, res) => {
  try {
    const { executionId } = req.params;

    const execution = await dbGetAsync(`
      SELECT e.*, 
             c.title as checklist_title,
             u.name as executed_by_name
      FROM checklist_executions e
      LEFT JOIN checklists c ON e.checklist_id = c.id
      LEFT JOIN users u ON e.executed_by = u.id
      WHERE e.id = ?
    `, [executionId]);

    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }

    const responses = await dbAllAsync(`
      SELECT er.*, ci.title as item_title
      FROM execution_responses er
      LEFT JOIN checklist_items ci ON er.item_id = ci.id
      WHERE er.execution_id = ?
    `, [executionId]);

    res.json({ ...execution, responses });
  } catch (error) {
    console.error('Erro ao obter execução:', error);
    res.status(500).json({ error: 'Erro ao obter execução' });
  }
});

// Listar execuções de um checklist
router.get('/checklist/:checklistId', authenticateToken, async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { status, start_date, end_date, limit = 50 } = req.query;

    let query = `
      SELECT e.*, u.name as executed_by_name,
             (SELECT COUNT(*) FROM execution_responses WHERE execution_id = e.id AND is_checked = 1) as checked_count,
             (SELECT COUNT(*) FROM checklist_items WHERE checklist_id = e.checklist_id) as total_items
      FROM checklist_executions e
      LEFT JOIN users u ON e.executed_by = u.id
      WHERE e.checklist_id = ?
    `;

    const params = [checklistId];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (start_date) {
      query += ' AND e.executed_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND e.executed_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY e.executed_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const executions = await dbAllAsync(query, params);
    res.json(executions);
  } catch (error) {
    console.error('Erro ao listar execuções:', error);
    res.status(500).json({ error: 'Erro ao listar execuções' });
  }
});

// Gerar imagem do comprovante
router.get('/:executionId/certificate', authenticateToken, async (req, res) => {
  try {
    const { executionId } = req.params;

    // Buscar execução com dados completos
    const execution = await dbGetAsync(`
      SELECT e.*, 
             c.title as checklist_title,
             c.description as checklist_description,
             u.name as executed_by_name,
             u.email as executed_by_email,
             comp.name as company_name
      FROM checklist_executions e
      LEFT JOIN checklists c ON e.checklist_id = c.id
      LEFT JOIN users u ON e.executed_by = u.id
      LEFT JOIN companies comp ON c.company_id = comp.id
      WHERE e.id = ?
    `, [executionId]);

    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }

    // Buscar itens do checklist com respostas
    const items = await dbAllAsync(`
      SELECT ci.id, ci.title, ci.description, ci.is_required,
             COALESCE(er.is_checked, 0) as is_checked,
             COALESCE(er.is_not_applicable, 0) as is_not_applicable
      FROM checklist_items ci
      LEFT JOIN execution_responses er ON ci.id = er.item_id AND er.execution_id = ?
      WHERE ci.checklist_id = ?
      ORDER BY ci.order_index
    `, [executionId, execution.checklist_id]);

    const totalItems = items.length;
    const checkedItems = items.filter(i => i.is_checked).length;
    const notApplicableItems = items.filter(i => i.is_not_applicable).length;
    const completionRate = totalItems > 0 
      ? Math.round(((checkedItems + notApplicableItems) / totalItems) * 100)
      : 0;

    // Gerar imagem
    const imageBuffer = await generateCertificateImage({
      checklistTitle: execution.checklist_title,
      companyName: execution.company_name,
      executedBy: execution.executed_by_name,
      executedAt: execution.completed_at || execution.executed_at,
      items,
      totalItems,
      checkedItems,
      notApplicableItems,
      completionRate
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="checklist-${executionId}.png"`
    });
    res.send(imageBuffer);

  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    res.status(500).json({ error: 'Erro ao gerar certificado' });
  }
});

// Enviar comprovante por email
router.post('/:executionId/share/email', authenticateToken, async (req, res) => {
  try {
    const { executionId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Buscar execução com dados completos
    const execution = await dbGetAsync(`
      SELECT e.*, 
             c.title as checklist_title,
             u.name as executed_by_name,
             comp.name as company_name
      FROM checklist_executions e
      LEFT JOIN checklists c ON e.checklist_id = c.id
      LEFT JOIN users u ON e.executed_by = u.id
      LEFT JOIN companies comp ON c.company_id = comp.id
      WHERE e.id = ?
    `, [executionId]);

    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }

    // Buscar itens do checklist com respostas
    const items = await dbAllAsync(`
      SELECT ci.id, ci.title, ci.is_required,
             COALESCE(er.is_checked, 0) as is_checked,
             COALESCE(er.is_not_applicable, 0) as is_not_applicable
      FROM checklist_items ci
      LEFT JOIN execution_responses er ON ci.id = er.item_id AND er.execution_id = ?
      WHERE ci.checklist_id = ?
      ORDER BY ci.order_index
    `, [executionId, execution.checklist_id]);

    const totalItems = items.length;
    const checkedItems = items.filter(i => i.is_checked).length;
    const notApplicableItems = items.filter(i => i.is_not_applicable).length;
    const completionRate = totalItems > 0 
      ? Math.round(((checkedItems + notApplicableItems) / totalItems) * 100)
      : 0;

    // Gerar imagem
    const imageBuffer = await generateCertificateImage({
      checklistTitle: execution.checklist_title,
      companyName: execution.company_name,
      executedBy: execution.executed_by_name,
      executedAt: execution.completed_at || execution.executed_at,
      items,
      totalItems,
      checkedItems,
      notApplicableItems,
      completionRate
    });

    // Enviar email
    const result = await sendChecklistCertificate(email, {
      userName: execution.executed_by_name,
      checklistTitle: execution.checklist_title,
      companyName: execution.company_name,
      executedAt: execution.completed_at || execution.executed_at,
      completionRate
    }, imageBuffer);

    if (result.success) {
      res.json({ message: 'Comprovante enviado por email com sucesso' });
    } else {
      res.status(500).json({ error: 'Erro ao enviar email' });
    }

  } catch (error) {
    console.error('Erro ao enviar comprovante por email:', error);
    res.status(500).json({ error: 'Erro ao enviar comprovante' });
  }
});

// Obter dados para compartilhamento (imagem em base64)
router.get('/:executionId/share', authenticateToken, async (req, res) => {
  try {
    const { executionId } = req.params;

    // Buscar execução com dados completos
    const execution = await dbGetAsync(`
      SELECT e.*, 
             c.title as checklist_title,
             u.name as executed_by_name,
             comp.name as company_name
      FROM checklist_executions e
      LEFT JOIN checklists c ON e.checklist_id = c.id
      LEFT JOIN users u ON e.executed_by = u.id
      LEFT JOIN companies comp ON c.company_id = comp.id
      WHERE e.id = ?
    `, [executionId]);

    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }

    // Buscar itens do checklist com respostas
    const items = await dbAllAsync(`
      SELECT ci.id, ci.title, ci.is_required,
             COALESCE(er.is_checked, 0) as is_checked,
             COALESCE(er.is_not_applicable, 0) as is_not_applicable
      FROM checklist_items ci
      LEFT JOIN execution_responses er ON ci.id = er.item_id AND er.execution_id = ?
      WHERE ci.checklist_id = ?
      ORDER BY ci.order_index
    `, [executionId, execution.checklist_id]);

    const totalItems = items.length;
    const checkedItems = items.filter(i => i.is_checked).length;
    const notApplicableItems = items.filter(i => i.is_not_applicable).length;
    const completionRate = totalItems > 0 
      ? Math.round(((checkedItems + notApplicableItems) / totalItems) * 100)
      : 0;

    // Gerar imagem
    const imageBuffer = await generateCertificateImage({
      checklistTitle: execution.checklist_title,
      companyName: execution.company_name,
      executedBy: execution.executed_by_name,
      executedAt: execution.completed_at || execution.executed_at,
      items,
      totalItems,
      checkedItems,
      notApplicableItems,
      completionRate
    });

    // Retornar como base64 para uso no frontend
    const base64Image = imageBuffer.toString('base64');

    res.json({
      image: `data:image/png;base64,${base64Image}`,
      filename: `checklist-${execution.checklist_title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`,
      execution: {
        id: executionId,
        checklistTitle: execution.checklist_title,
        companyName: execution.company_name,
        executedBy: execution.executed_by_name,
        executedAt: execution.completed_at || execution.executed_at,
        completionRate
      }
    });

  } catch (error) {
    console.error('Erro ao obter dados de compartilhamento:', error);
    res.status(500).json({ error: 'Erro ao obter dados de compartilhamento' });
  }
});

// Dashboard - Estatísticas de execução
router.get('/stats/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period = '7' } = req.query; // dias

    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date().toISOString().split('T')[0];

    // Total de execuções no período
    const totalExecutions = await dbGetAsync(`
      SELECT COUNT(*) as count
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND e.executed_at >= ?
    `, [companyId, startDate]);

    // Execuções completadas no período
    const completedExecutions = await dbGetAsync(`
      SELECT COUNT(*) as count
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND e.executed_at >= ? AND e.status = 'completed'
    `, [companyId, startDate]);

    // Execuções hoje
    const todayExecutions = await dbGetAsync(`
      SELECT COUNT(*) as count
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND DATE(e.executed_at) = ?
    `, [companyId, todayStart]);

    // Execuções em andamento
    const inProgressExecutions = await dbGetAsync(`
      SELECT COUNT(*) as count
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND e.status = 'in_progress'
    `, [companyId]);

    // Total de itens respondidos no período
    const totalItemsResponded = await dbGetAsync(`
      SELECT COUNT(*) as count
      FROM execution_responses er
      JOIN checklist_executions e ON er.execution_id = e.id
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND e.executed_at >= ? AND (er.is_checked = 1 OR er.is_not_applicable = 1)
    `, [companyId, startDate]);

    // Itens marcados como N/A
    const notApplicableItems = await dbGetAsync(`
      SELECT COUNT(*) as count
      FROM execution_responses er
      JOIN checklist_executions e ON er.execution_id = e.id
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND e.executed_at >= ? AND er.is_not_applicable = 1
    `, [companyId, startDate]);

    // Checklists mais executados
    const topChecklists = await dbAllAsync(`
      SELECT c.id, c.title, COUNT(e.id) as execution_count
      FROM checklists c
      LEFT JOIN checklist_executions e ON c.id = e.checklist_id AND e.executed_at >= ?
      WHERE c.company_id = ?
      GROUP BY c.id
      ORDER BY execution_count DESC
      LIMIT 5
    `, [startDate, companyId]);

    // Execuções por dia
    const executionsByDay = await dbAllAsync(`
      SELECT DATE(e.executed_at) as date, COUNT(*) as count
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND e.executed_at >= ?
      GROUP BY DATE(e.executed_at)
      ORDER BY date
    `, [companyId, startDate]);

    // Usuários mais ativos
    const topUsers = await dbAllAsync(`
      SELECT u.id, u.name, COUNT(e.id) as execution_count
      FROM users u
      JOIN checklist_executions e ON e.executed_by = u.id
      JOIN checklists c ON e.checklist_id = c.id
      WHERE c.company_id = ? AND e.executed_at >= ?
      GROUP BY u.id
      ORDER BY execution_count DESC
      LIMIT 5
    `, [companyId, startDate]);

    // Execuções por categoria
    const executionsByCategory = await dbAllAsync(`
      SELECT cat.id, cat.name, COUNT(e.id) as execution_count
      FROM checklist_categories cat
      LEFT JOIN checklists c ON c.category_id = cat.id
      LEFT JOIN checklist_executions e ON e.checklist_id = c.id AND e.executed_at >= ?
      WHERE cat.company_id = ?
      GROUP BY cat.id
      ORDER BY execution_count DESC
    `, [startDate, companyId]);

    // Taxa de conclusão
    const completionRate = totalExecutions.count > 0 
      ? Math.round((completedExecutions.count / totalExecutions.count) * 100) 
      : 0;

    // Média de execuções por dia
    const avgExecutionsPerDay = parseInt(period) > 0 
      ? Math.round(totalExecutions.count / parseInt(period) * 10) / 10
      : 0;

    res.json({
      total_executions: totalExecutions.count,
      completed_executions: completedExecutions.count,
      today_executions: todayExecutions.count,
      in_progress_executions: inProgressExecutions.count,
      total_items_responded: totalItemsResponded.count,
      not_applicable_items: notApplicableItems.count,
      completion_rate: completionRate,
      avg_executions_per_day: avgExecutionsPerDay,
      top_checklists: topChecklists,
      top_users: topUsers,
      executions_by_day: executionsByDay,
      executions_by_category: executionsByCategory
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
