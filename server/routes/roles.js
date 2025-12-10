import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRunAsync, dbGetAsync, dbAllAsync } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Cargos padrão para criar quando uma empresa é criada
export const DEFAULT_ROLES = [
  { name: 'Gerente', description: 'Gerente geral com acesso completo', permissions: JSON.stringify(['all']) },
  { name: 'Supervisor', description: 'Supervisor de equipe', permissions: JSON.stringify(['view', 'execute', 'reports']) },
  { name: 'Colaborador', description: 'Colaborador padrão', permissions: JSON.stringify(['view', 'execute']) },
  { name: 'Cozinheiro', description: 'Equipe de cozinha', permissions: JSON.stringify(['view', 'execute']) },
  { name: 'Garçom', description: 'Equipe de atendimento', permissions: JSON.stringify(['view', 'execute']) },
  { name: 'Auxiliar', description: 'Auxiliar de serviços gerais', permissions: JSON.stringify(['view', 'execute']) }
];

// Listar cargos da empresa
router.get('/', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Usuário não vinculado a uma empresa' });
    }

    const roles = await dbAllAsync(`
      SELECT r.*, 
             (SELECT COUNT(*) FROM users WHERE role_id = r.id) as users_count
      FROM roles r
      WHERE r.company_id = ?
      ORDER BY r.name
    `, [companyId]);

    res.json(roles);
  } catch (error) {
    console.error('Erro ao listar cargos:', error);
    res.status(500).json({ error: 'Erro ao listar cargos' });
  }
});

// Obter cargo por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const role = await dbGetAsync(`
      SELECT r.*, 
             (SELECT COUNT(*) FROM users WHERE role_id = r.id) as users_count
      FROM roles r
      WHERE r.id = ?
    `, [id]);

    if (!role) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    // Verificar se é da mesma empresa
    if (role.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(role);
  } catch (error) {
    console.error('Erro ao obter cargo:', error);
    res.status(500).json({ error: 'Erro ao obter cargo' });
  }
});

// Criar novo cargo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const companyId = req.user.company_id;

    if (!name) {
      return res.status(400).json({ error: 'Nome do cargo é obrigatório' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Você precisa ter uma empresa para criar cargos' });
    }

    // Verificar se já existe cargo com esse nome na empresa
    const existingRole = await dbGetAsync('SELECT id FROM roles WHERE name = ? AND company_id = ?', [name, companyId]);
    if (existingRole) {
      return res.status(400).json({ error: 'Já existe um cargo com esse nome' });
    }

    const roleId = uuidv4();

    await dbRunAsync(`
      INSERT INTO roles (id, name, description, company_id, permissions)
      VALUES (?, ?, ?, ?, ?)
    `, [roleId, name, description || null, companyId, permissions ? JSON.stringify(permissions) : null]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'CREATE', 'role', ?, ?)
    `, [uuidv4(), req.user.id, roleId, JSON.stringify({ name })]);

    res.status(201).json({
      message: 'Cargo criado com sucesso',
      role: { id: roleId, name, description, permissions }
    });
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    res.status(500).json({ error: 'Erro ao criar cargo' });
  }
});

// Atualizar cargo
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await dbGetAsync('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    // Verificar permissão
    if (role.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar nome duplicado
    if (name && name !== role.name) {
      const existingRole = await dbGetAsync('SELECT id FROM roles WHERE name = ? AND company_id = ? AND id != ?', 
        [name, role.company_id, id]);
      if (existingRole) {
        return res.status(400).json({ error: 'Já existe um cargo com esse nome' });
      }
    }

    await dbRunAsync(`
      UPDATE roles 
      SET name = ?, description = ?, permissions = ?
      WHERE id = ?
    `, [
      name || role.name,
      description !== undefined ? description : role.description,
      permissions ? JSON.stringify(permissions) : role.permissions,
      id
    ]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'UPDATE', 'role', ?, ?)
    `, [uuidv4(), req.user.id, id, JSON.stringify({ updated_fields: Object.keys(req.body) })]);

    res.json({ message: 'Cargo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro ao atualizar cargo' });
  }
});

// Deletar cargo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const role = await dbGetAsync('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    // Verificar permissão
    if (role.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se há usuários com este cargo
    const usersWithRole = await dbGetAsync('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [id]);
    if (usersWithRole && usersWithRole.count > 0) {
      return res.status(400).json({ 
        error: `Não é possível excluir. Existem ${usersWithRole.count} usuário(s) com este cargo.` 
      });
    }

    await dbRunAsync('DELETE FROM roles WHERE id = ?', [id]);

    // Log de auditoria
    await dbRunAsync(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'DELETE', 'role', ?, ?)
    `, [uuidv4(), req.user.id, id, JSON.stringify({ role_name: role.name })]);

    res.json({ message: 'Cargo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cargo:', error);
    res.status(500).json({ error: 'Erro ao deletar cargo' });
  }
});

// Criar cargos padrão para uma empresa
export async function createDefaultRoles(companyId) {
  for (const role of DEFAULT_ROLES) {
    await dbRunAsync(`
      INSERT INTO roles (id, name, description, company_id, permissions)
      VALUES (?, ?, ?, ?, ?)
    `, [uuidv4(), role.name, role.description, companyId, role.permissions]);
  }
}

export default router;
