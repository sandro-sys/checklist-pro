import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRunAsync, dbGetAsync, dbAllAsync, withTransaction } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ── ENDPOINTS PÚBLICOS (sem autenticação) ─────────────────────────────

router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const list = await dbGetAsync(
      `SELECT sl.*, comp.name as company_name
       FROM stock_lists sl
       LEFT JOIN companies comp ON sl.company_id = comp.id
       WHERE sl.id = ? AND sl.deleted_at IS NULL`,
      [id]
    );
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    const items = await dbAllAsync(
      `SELECT sli.*, p.has_flavor as product_has_flavor
       FROM stock_list_items sli
       LEFT JOIN products p ON sli.product_id = p.id
       WHERE sli.list_id = ?
       ORDER BY sli.order_index ASC, sli.created_at ASC`,
      [id]
    );
    res.json({ ...list, items });
  } catch (e) {
    console.error('Erro ao obter lista pública:', e);
    res.status(500).json({ error: 'Erro ao obter lista' });
  }
});

router.put('/public/:id/items/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { quantity, flavor, notes } = req.body;

    const list = await dbGetAsync(`SELECT status FROM stock_lists WHERE id = ?`, [id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });
    if (list.status === 'finalizada') return res.status(400).json({ error: 'Lista finalizada' });

    const item = await dbGetAsync(`SELECT * FROM stock_list_items WHERE id = ? AND list_id = ?`, [itemId, id]);
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });

    await dbRunAsync(
      `UPDATE stock_list_items SET quantity = ?, flavor = ?, notes = ? WHERE id = ?`,
      [
        quantity !== undefined ? (quantity !== '' ? parseFloat(String(quantity).replace(',', '.')) : null) : item.quantity,
        flavor !== undefined ? flavor : item.flavor,
        notes !== undefined ? notes : item.notes,
        itemId
      ]
    );
    res.json({ message: 'Item atualizado', item: await dbGetAsync(`SELECT * FROM stock_list_items WHERE id = ?`, [itemId]) });
  } catch (e) {
    console.error('Erro ao atualizar item público:', e);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// ── ROTAS PROTEGIDAS ──────────────────────────────────────────────────
router.use(authenticateToken);

function guardCompany(req, res) {
  if (!req.user.company_id) {
    res.status(400).json({ error: 'Usuário não vinculado a uma empresa' });
    return false;
  }
  return true;
}

// ── PRODUTOS ─────────────────────────────────────────────────────────

router.get('/products', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { include_inactive } = req.query;
    let sql = `SELECT * FROM products WHERE company_id = ?`;
    if (!include_inactive) sql += ` AND is_active = 1`;
    sql += ` ORDER BY name ASC`;
    res.json(await dbAllAsync(sql, [req.user.company_id]));
  } catch (e) {
    console.error('Erro ao listar produtos:', e);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

router.post('/products', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { name, unit, min_stock, category, has_flavor } = req.body;
    if (!name || !unit) return res.status(400).json({ error: 'Nome e unidade são obrigatórios' });

    const normalizedName = name.toUpperCase().trim();
    const existing = await dbGetAsync(
      `SELECT id FROM products WHERE company_id = ? AND name = ? AND is_active = 1`,
      [req.user.company_id, normalizedName]
    );
    if (existing) return res.status(400).json({ error: 'Produto já cadastrado com este nome' });

    const id = uuidv4();
    await dbRunAsync(
      `INSERT INTO products (id, company_id, name, unit, category, current_stock, min_stock, has_flavor, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, 1, ?)`,
      [id, req.user.company_id, normalizedName, unit.toUpperCase().trim(), category || 'Outros', parseFloat(min_stock) || 0, has_flavor ? 1 : 0, req.user.id]
    );
    res.status(201).json({ message: 'Produto criado', product: await dbGetAsync(`SELECT * FROM products WHERE id = ?`, [id]) });
  } catch (e) {
    console.error('Erro ao criar produto:', e);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

router.put('/products/:id', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const { name, unit, min_stock, category, has_flavor } = req.body;
    const product = await dbGetAsync(`SELECT * FROM products WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    await dbRunAsync(
      `UPDATE products SET name = ?, unit = ?, category = ?, min_stock = ?, has_flavor = ?, updated_at = ? WHERE id = ?`,
      [
        name ? name.toUpperCase().trim() : product.name,
        unit ? unit.toUpperCase().trim() : product.unit,
        category !== undefined ? category : product.category,
        min_stock !== undefined ? parseFloat(min_stock) : product.min_stock,
        has_flavor !== undefined ? (has_flavor ? 1 : 0) : product.has_flavor,
        new Date().toISOString(), id
      ]
    );
    res.json({ message: 'Produto atualizado', product: await dbGetAsync(`SELECT * FROM products WHERE id = ?`, [id]) });
  } catch (e) {
    console.error('Erro ao atualizar produto:', e);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

router.delete('/products/:id', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const product = await dbGetAsync(`SELECT id FROM products WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    await dbRunAsync(`UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
    res.json({ message: 'Produto desativado' });
  } catch (e) {
    console.error('Erro ao desativar produto:', e);
    res.status(500).json({ error: 'Erro ao desativar produto' });
  }
});

// Copiar produto
router.post('/products/:id/copy', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const original = await dbGetAsync(`SELECT * FROM products WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!original) return res.status(404).json({ error: 'Produto não encontrado' });

    const newName = `${original.name} (CÓPIA)`;
    const exists = await dbGetAsync(`SELECT id FROM products WHERE company_id = ? AND name = ? AND is_active = 1`, [req.user.company_id, newName]);
    if (exists) return res.status(400).json({ error: 'Já existe uma cópia deste produto' });

    const newId = uuidv4();
    const now = new Date().toISOString();
    await dbRunAsync(
      `INSERT INTO products (id, company_id, name, unit, current_stock, min_stock, category, has_flavor, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [newId, req.user.company_id, newName, original.unit, 0, original.min_stock || 0, original.category || 'Outros', original.has_flavor || 0, now, now]
    );
    res.json({ product: await dbGetAsync(`SELECT * FROM products WHERE id = ?`, [newId]) });
  } catch (e) {
    console.error('Erro ao copiar produto:', e);
    res.status(500).json({ error: 'Erro ao copiar produto' });
  }
});

// ── LISTAS ───────────────────────────────────────────────────────────

router.get('/lists', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const lists = await dbAllAsync(
      `SELECT sl.*, u.name as created_by_name, u2.name as assigned_to_name,
         (SELECT COUNT(*) FROM stock_list_items WHERE list_id = sl.id) as items_count
       FROM stock_lists sl
       LEFT JOIN users u  ON sl.created_by  = u.id
       LEFT JOIN users u2 ON sl.assigned_to = u2.id
       WHERE sl.company_id = ? AND sl.deleted_at IS NULL
       ORDER BY sl.name ASC`,
      [req.user.company_id]
    );
    const companyUsers = await dbAllAsync(`SELECT id, name FROM users WHERE company_id = ?`, [req.user.company_id]);
    const userMap = Object.fromEntries(companyUsers.map(u => [u.id, u.name]));
    const processed = lists.map(list => {
      let assigned_to_ids = [];
      let assigned_to_names = [];
      if (list.assigned_to_ids) {
        try {
          assigned_to_ids = JSON.parse(list.assigned_to_ids);
          assigned_to_names = assigned_to_ids.map(id => userMap[id]).filter(Boolean);
        } catch {}
      } else if (list.assigned_to) {
        assigned_to_ids = [list.assigned_to];
        assigned_to_names = list.assigned_to_name ? [list.assigned_to_name] : [];
      }
      return { ...list, assigned_to_ids, assigned_to_names };
    });
    // Usuários comuns (role_type='user') só veem as listas em que são responsáveis
    const isPrivileged = req.user.role_type !== 'user' || req.user.is_master;
    const result = isPrivileged ? processed : processed.filter(l => {
      const ids = Array.isArray(l.assigned_to_ids) ? l.assigned_to_ids : [];
      return ids.includes(req.user.id) || l.assigned_to === req.user.id;
    });
    res.json(result);
  } catch (e) {
    console.error('Erro ao listar listas:', e);
    res.status(500).json({ error: 'Erro ao listar listas' });
  }
});

// Importar lista a partir de texto (Nome;Unidade por linha)
router.post('/lists/import-txt', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { name, type, notes, content } = req.body;
    if (!name || !type || !content) return res.status(400).json({ error: 'Nome, tipo e conteúdo são obrigatórios' });
    if (!['contagem', 'compras', 'inventario'].includes(type))
      return res.status(400).json({ error: 'Tipo inválido' });

    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    if (lines.length === 0) return res.status(400).json({ error: 'Nenhum item encontrado no arquivo' });
    if (lines.length > 500) return res.status(400).json({ error: 'Máximo de 500 itens por importação' });

    const items = lines.map((line, idx) => {
      const parts = line.split(';');
      const itemName = parts[0].trim().toUpperCase();
      const unit = parts[1] ? parts[1].trim().toUpperCase() : null;
      return { name: itemName, unit, order_index: idx };
    }).filter(i => i.name.length > 0);

    const listId = uuidv4();
    const now = new Date().toISOString();
    await dbRunAsync(
      `INSERT INTO stock_lists (id, company_id, name, type, status, notes, created_by) VALUES (?, ?, ?, ?, 'editing', ?, ?)`,
      [listId, req.user.company_id, name.toUpperCase().trim(), type, notes || null, req.user.id]
    );

    for (const item of items) {
      await dbRunAsync(
        `INSERT INTO stock_list_items (id, list_id, name, unit, quantity, order_index, created_at) VALUES (?, ?, ?, ?, NULL, ?, ?)`,
        [uuidv4(), listId, item.name, item.unit || 'UN', item.order_index, now]
      );
    }

    const list = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ?`, [listId]);
    res.status(201).json({ message: `Lista criada com ${items.length} itens`, list, items_imported: items.length });
  } catch (e) {
    console.error('Erro ao importar lista:', e);
    res.status(500).json({ error: 'Erro ao importar lista' });
  }
});

router.post('/lists', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { name, type, notes, assigned_to_ids } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    if (!['contagem', 'compras', 'inventario'].includes(type))
      return res.status(400).json({ error: 'Tipo inválido. Use: contagem, compras ou inventario' });

    const ids = Array.isArray(assigned_to_ids) ? assigned_to_ids : [];
    const id = uuidv4();
    await dbRunAsync(
      `INSERT INTO stock_lists (id, company_id, name, type, status, notes, created_by, assigned_to, assigned_to_ids) VALUES (?, ?, ?, ?, 'editing', ?, ?, ?, ?)`,
      [id, req.user.company_id, name.toUpperCase().trim(), type, notes || null, req.user.id, ids[0] || null, ids.length ? JSON.stringify(ids) : null]
    );
    res.status(201).json({ message: 'Lista criada', list: await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ?`, [id]) });
  } catch (e) {
    console.error('Erro ao criar lista:', e);
    res.status(500).json({ error: 'Erro ao criar lista' });
  }
});

router.get('/lists/trash', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const lists = await dbAllAsync(
      `SELECT * FROM stock_lists WHERE company_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 30`,
      [req.user.company_id]
    );
    res.json(lists);
  } catch (e) {
    console.error('Erro ao listar lixeira:', e);
    res.status(500).json({ error: 'Erro ao listar lixeira' });
  }
});

router.get('/lists/:id', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(
      `SELECT sl.*, u.name as created_by_name, u2.name as assigned_to_name
       FROM stock_lists sl
       LEFT JOIN users u  ON sl.created_by  = u.id
       LEFT JOIN users u2 ON sl.assigned_to = u2.id
       WHERE sl.id = ? AND sl.company_id = ? AND sl.deleted_at IS NULL`,
      [id, req.user.company_id]
    );
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    // Resolve multiple assignees
    const companyUsers = await dbAllAsync(`SELECT id, name FROM users WHERE company_id = ?`, [req.user.company_id]);
    const userMap = Object.fromEntries(companyUsers.map(u => [u.id, u.name]));
    let assigned_to_ids = [];
    let assigned_to_names = [];
    if (list.assigned_to_ids) {
      try {
        assigned_to_ids = JSON.parse(list.assigned_to_ids);
        assigned_to_names = assigned_to_ids.map(id => userMap[id]).filter(Boolean);
      } catch {}
    } else if (list.assigned_to) {
      assigned_to_ids = [list.assigned_to];
      assigned_to_names = list.assigned_to_name ? [list.assigned_to_name] : [];
    }

    const items = await dbAllAsync(
      `SELECT sli.*, p.current_stock as product_current_stock, p.min_stock as product_min_stock, p.has_flavor as product_has_flavor
       FROM stock_list_items sli
       LEFT JOIN products p ON sli.product_id = p.id
       WHERE sli.list_id = ?
       ORDER BY sli.order_index ASC, sli.created_at ASC`,
      [id]
    );
    res.json({ ...list, assigned_to_ids, assigned_to_names, items });
  } catch (e) {
    console.error('Erro ao obter lista:', e);
    res.status(500).json({ error: 'Erro ao obter lista' });
  }
});

router.put('/lists/:id', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const { name, notes, assigned_to_ids } = req.body;
    const list = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    let newIds, newIdsJson, primaryId;
    if (assigned_to_ids !== undefined) {
      newIds = Array.isArray(assigned_to_ids) ? assigned_to_ids : [];
      newIdsJson = newIds.length ? JSON.stringify(newIds) : null;
      primaryId = newIds[0] || null;
    } else {
      newIdsJson = list.assigned_to_ids;
      primaryId = list.assigned_to;
    }

    await dbRunAsync(
      `UPDATE stock_lists SET name = ?, notes = ?, assigned_to = ?, assigned_to_ids = ?, updated_at = ? WHERE id = ?`,
      [
        name ? name.toUpperCase().trim() : list.name,
        notes !== undefined ? notes : list.notes,
        primaryId,
        newIdsJson,
        new Date().toISOString(),
        id
      ]
    );
    res.json({ message: 'Lista atualizada' });
  } catch (e) {
    console.error('Erro ao atualizar lista:', e);
    res.status(500).json({ error: 'Erro ao atualizar lista' });
  }
});

// ── ITENS DA LISTA ───────────────────────────────────────────────────

router.post('/lists/:id/items', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const { product_id, name, unit, quantity, notes, flavor } = req.body;

    const list = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });
    if (!name) return res.status(400).json({ error: 'Nome do item é obrigatório' });

    const maxOrder = await dbGetAsync(`SELECT MAX(order_index) as max_idx FROM stock_list_items WHERE list_id = ?`, [id]);
    const nextIndex = ((maxOrder?.max_idx) ?? -1) + 1;
    const itemId = uuidv4();

    await dbRunAsync(
      `INSERT INTO stock_list_items (id, list_id, product_id, name, unit, quantity, notes, flavor, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [itemId, id, product_id || null, name.toUpperCase().trim(), unit ? unit.toUpperCase().trim() : null, quantity !== undefined ? parseFloat(quantity) : null, notes || null, flavor || null, nextIndex]
    );
    res.status(201).json({ message: 'Item adicionado', item: await dbGetAsync(`SELECT * FROM stock_list_items WHERE id = ?`, [itemId]) });
  } catch (e) {
    console.error('Erro ao adicionar item:', e);
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
});

router.put('/lists/:id/items/:itemId', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id, itemId } = req.params;
    const { name, unit, quantity, notes, flavor } = req.body;

    const list = await dbGetAsync(`SELECT status FROM stock_lists WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    const item = await dbGetAsync(`SELECT * FROM stock_list_items WHERE id = ? AND list_id = ?`, [itemId, id]);
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });

    await dbRunAsync(
      `UPDATE stock_list_items SET name = ?, unit = ?, quantity = ?, notes = ?, flavor = ? WHERE id = ?`,
      [
        name ? name.toUpperCase().trim() : item.name,
        unit !== undefined ? (unit ? unit.toUpperCase().trim() : null) : item.unit,
        quantity !== undefined ? parseFloat(quantity) : item.quantity,
        notes !== undefined ? notes : item.notes,
        flavor !== undefined ? flavor : item.flavor,
        itemId
      ]
    );
    res.json({ message: 'Item atualizado', item: await dbGetAsync(`SELECT * FROM stock_list_items WHERE id = ?`, [itemId]) });
  } catch (e) {
    console.error('Erro ao atualizar item:', e);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

router.delete('/lists/:id/items/:itemId', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id, itemId } = req.params;
    const list = await dbGetAsync(`SELECT status FROM stock_lists WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });
    await dbRunAsync(`DELETE FROM stock_list_items WHERE id = ? AND list_id = ?`, [itemId, id]);
    res.json({ message: 'Item removido' });
  } catch (e) {
    console.error('Erro ao remover item:', e);
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

// Mover lista para lixeira (soft delete)
router.delete('/lists/:id', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(`SELECT id, name FROM stock_lists WHERE id = ? AND company_id = ? AND deleted_at IS NULL`, [id, req.user.company_id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });
    await dbRunAsync(`UPDATE stock_lists SET deleted_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
    res.json({ message: 'Lista movida para a lixeira', list_name: list.name });
  } catch (e) {
    console.error('Erro ao excluir lista:', e);
    res.status(500).json({ error: 'Erro ao excluir lista' });
  }
});

// Restaurar lista da lixeira
router.post('/lists/:id/restore', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(`SELECT id FROM stock_lists WHERE id = ? AND company_id = ? AND deleted_at IS NOT NULL`, [id, req.user.company_id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada na lixeira' });
    await dbRunAsync(`UPDATE stock_lists SET deleted_at = NULL, updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
    res.json({ message: 'Lista restaurada' });
  } catch (e) {
    console.error('Erro ao restaurar lista:', e);
    res.status(500).json({ error: 'Erro ao restaurar lista' });
  }
});

// ── FINALIZAR LISTA ──────────────────────────────────────────────────

router.post('/lists/:id/finalize', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });
    if (list.status === 'finalizada') return res.status(400).json({ error: 'Lista já finalizada' });

    const items = await dbAllAsync(`SELECT * FROM stock_list_items WHERE list_id = ? ORDER BY order_index`, [id]);
    if (items.length === 0) return res.status(400).json({ error: 'Lista vazia — adicione itens antes de finalizar' });

    const now = new Date().toISOString();

    await withTransaction(async (txn) => {
      await txn.run(
        `UPDATE stock_lists SET status = 'finalizada', finalized_at = ?, finalized_by = ?, updated_at = ? WHERE id = ?`,
        [now, req.user.id, now, id]
      );

      for (const item of items) {
        if (!item.product_id || item.quantity === null || item.quantity === undefined) continue;

        const product = await dbGetAsync(`SELECT * FROM products WHERE id = ?`, [item.product_id]);
        if (!product) continue;

        const prev = parseFloat(product.current_stock) || 0;
        const qty = parseFloat(item.quantity);
        let newStock, movType, movQty;

        if (list.type === 'contagem' || list.type === 'inventario') {
          movType = 'ajuste';
          newStock = qty;
          movQty = qty - prev;
        } else {
          movType = 'entrada';
          newStock = prev + qty;
          movQty = qty;
        }

        await txn.run(
          `INSERT INTO stock_movements (id, product_id, company_id, type, quantity, previous_stock, new_stock, reason, list_id, user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), item.product_id, req.user.company_id, movType, movQty, prev, newStock, `Lista: ${list.name}`, id, req.user.id, now]
        );
        await txn.run(`UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?`, [newStock, now, item.product_id]);
      }
    });

    res.json({ message: 'Lista finalizada com sucesso' });
  } catch (e) {
    console.error('Erro ao finalizar lista:', e);
    res.status(500).json({ error: 'Erro ao finalizar lista' });
  }
});

// ── EXPORTAR TXT ─────────────────────────────────────────────────────

router.get('/lists/:id/export-txt', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(
      `SELECT sl.*, u.name as created_by_name FROM stock_lists sl LEFT JOIN users u ON sl.created_by = u.id WHERE sl.id = ? AND sl.company_id = ?`,
      [id, req.user.company_id]
    );
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    const company = await dbGetAsync(`SELECT name FROM companies WHERE id = ?`, [req.user.company_id]);
    const items = await dbAllAsync(
      `SELECT sli.*, p.current_stock, p.min_stock FROM stock_list_items sli
       LEFT JOIN products p ON sli.product_id = p.id
       WHERE sli.list_id = ? ORDER BY sli.order_index ASC`,
      [id]
    );

    const typeLabel = { contagem: 'CONTAGEM DE ESTOQUE', compras: 'LISTA DE COMPRAS', inventario: 'INVENTARIO' }[list.type] || list.type.toUpperCase();
    const dt = new Date(list.finalized_at || list.created_at);
    const dateStr = dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const sep = '='.repeat(62);
    const div = '-'.repeat(62);
    const pad  = (s, n) => String(s || '').slice(0, n).padEnd(n);
    const padL = (s, n) => String(s || '').slice(0, n).padStart(n);
    const fmtQty = (v) => v !== null && v !== undefined ? parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) : '---';

    const alerts = items.filter(i => i.product_id && i.min_stock != null && parseFloat(i.quantity ?? 0) < parseFloat(i.min_stock ?? 0));

    let txt = '';
    txt += sep + '\n';
    txt += `EMPRESA : ${(company?.name || '').toUpperCase()}\n`;
    txt += `TIPO    : ${typeLabel}\n`;
    txt += `STATUS  : ${list.status === 'finalizada' ? 'FINALIZADA' : 'EM EDICAO'}\n`;
    txt += `DATA    : ${dateStr}\n`;
    txt += `RESP.   : ${(list.created_by_name || '').toUpperCase()}\n`;
    if (list.notes) txt += `OBS     : ${list.notes.toUpperCase()}\n`;
    txt += sep + '\n\n';
    txt += pad('PRODUTO', 26) + padL('QTDE', 8) + padL('UNID', 6) + '  OBSERVACAO\n';
    txt += div + '\n';

    for (const item of items) {
      const alert = alerts.find(a => a.id === item.id) ? ' (!)' : '';
      const obs = [item.flavor ? `Sabor: ${item.flavor}` : null, item.notes || null].filter(Boolean).join(' | ');
      txt += pad(item.name + alert, 26) + padL(fmtQty(item.quantity), 8) + padL(item.unit || '', 6) + '  ' + obs + '\n';
    }

    txt += div + '\n';
    txt += `TOTAL DE ITENS: ${items.length}\n`;

    if (alerts.length > 0) {
      txt += '\n' + sep + '\n';
      txt += 'ALERTAS - ABAIXO DO MINIMO:\n';
      txt += div + '\n';
      for (const a of alerts) {
        txt += `(!) ${pad(a.name, 26)}  Contado: ${padL(fmtQty(a.quantity), 8)} ${a.unit || ''}  |  Minimo: ${padL(fmtQty(a.min_stock), 8)} ${a.unit || ''}\n`;
      }
    }

    txt += '\n' + sep + '\n';
    txt += 'Gerado por CheckList Pro\n';
    txt += sep + '\n';

    const filename = `estoque-${list.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` });
    res.send(txt);
  } catch (e) {
    console.error('Erro ao exportar:', e);
    res.status(500).json({ error: 'Erro ao exportar lista' });
  }
});

// Copiar lista (com todos os itens, quantidades zeradas)
router.post('/lists/:id/copy', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const original = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ? AND company_id = ?`, [id, req.user.company_id]);
    if (!original) return res.status(404).json({ error: 'Lista não encontrada' });

    const items = await dbAllAsync(`SELECT * FROM stock_list_items WHERE list_id = ? ORDER BY order_index ASC`, [id]);

    const newId = uuidv4();
    const now = new Date().toISOString();
    await dbRunAsync(
      `INSERT INTO stock_lists (id, company_id, name, type, status, notes, created_by, assigned_to, assigned_to_ids, created_at, updated_at) VALUES (?, ?, ?, ?, 'editing', ?, ?, ?, ?, ?, ?)`,
      [newId, req.user.company_id, `${original.name} (CÓPIA)`, original.type, original.notes || null, req.user.id, original.assigned_to || null, original.assigned_to_ids || null, now, now]
    );

    for (const item of items) {
      await dbRunAsync(
        `INSERT INTO stock_list_items (id, list_id, product_id, name, unit, quantity, notes, flavor, order_index, created_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
        [uuidv4(), newId, item.product_id || null, item.name, item.unit || 'UN', item.order_index, now]
      );
    }

    const newList = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ?`, [newId]);
    res.json({ list: newList });
  } catch (e) {
    console.error('Erro ao copiar lista:', e);
    res.status(500).json({ error: 'Erro ao copiar lista' });
  }
});

// Copiar itens desta lista para outra lista existente
router.post('/lists/:id/copy-items-to', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const { target_list_id } = req.body;
    if (!target_list_id) return res.status(400).json({ error: 'Lista destino obrigatória' });
    if (target_list_id === id) return res.status(400).json({ error: 'Origem e destino não podem ser a mesma lista' });

    const source = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ? AND company_id = ? AND deleted_at IS NULL`, [id, req.user.company_id]);
    if (!source) return res.status(404).json({ error: 'Lista origem não encontrada' });

    const target = await dbGetAsync(`SELECT * FROM stock_lists WHERE id = ? AND company_id = ? AND deleted_at IS NULL`, [target_list_id, req.user.company_id]);
    if (!target) return res.status(404).json({ error: 'Lista destino não encontrada' });

    const items = await dbAllAsync(`SELECT * FROM stock_list_items WHERE list_id = ? ORDER BY order_index ASC`, [id]);
    if (items.length === 0) return res.status(400).json({ error: 'Lista origem não tem itens para copiar' });

    const maxOrder = await dbGetAsync(`SELECT MAX(order_index) as max_idx FROM stock_list_items WHERE list_id = ?`, [target_list_id]);
    let nextIndex = ((maxOrder?.max_idx) ?? -1) + 1;
    const now = new Date().toISOString();

    for (const item of items) {
      await dbRunAsync(
        `INSERT INTO stock_list_items (id, list_id, product_id, name, unit, quantity, notes, flavor, order_index, created_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
        [uuidv4(), target_list_id, item.product_id || null, item.name, item.unit || 'UN', nextIndex++, now]
      );
    }

    res.json({ message: `${items.length} itens copiados para "${target.name}"`, items_copied: items.length, target_name: target.name });
  } catch (e) {
    console.error('Erro ao copiar itens:', e);
    res.status(500).json({ error: 'Erro ao copiar itens' });
  }
});

// ── SESSÕES DE CONTAGEM ──────────────────────────────────────────────

// Iniciar contagem (registra horário de início)
router.post('/lists/:id/start-counting', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(
      `SELECT * FROM stock_lists WHERE id = ? AND company_id = ?`,
      [id, req.user.company_id]
    );
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    // Verifica se já existe sessão ativa para este usuário nesta lista
    let session = await dbGetAsync(
      `SELECT * FROM stock_counting_sessions WHERE list_id = ? AND counted_by = ? AND completed_at IS NULL`,
      [id, req.user.id]
    );
    if (!session) {
      const sessionId = uuidv4();
      const now = new Date().toISOString();
      await dbRunAsync(
        `INSERT INTO stock_counting_sessions (id, list_id, company_id, counted_by, counted_by_name, started_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, id, req.user.company_id, req.user.id, req.user.name, now]
      );
      session = await dbGetAsync(`SELECT * FROM stock_counting_sessions WHERE id = ?`, [sessionId]);
    }
    res.json({ session });
  } catch (e) {
    console.error('Erro ao iniciar contagem:', e);
    res.status(500).json({ error: 'Erro ao iniciar contagem' });
  }
});

// Concluir contagem (registra horário de fim e contagem de itens)
router.post('/lists/:id/complete-counting', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(
      `SELECT * FROM stock_lists WHERE id = ? AND company_id = ?`,
      [id, req.user.company_id]
    );
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    const items = await dbAllAsync(`SELECT * FROM stock_list_items WHERE list_id = ?`, [id]);
    const filled = items.filter(i => i.quantity !== null && i.quantity !== undefined);

    const now = new Date().toISOString();
    await dbRunAsync(
      `UPDATE stock_counting_sessions SET completed_at = ?, items_total = ?, items_filled = ? WHERE list_id = ? AND counted_by = ? AND completed_at IS NULL`,
      [now, items.length, filled.length, id, req.user.id]
    );

    const session = await dbGetAsync(
      `SELECT * FROM stock_counting_sessions WHERE list_id = ? AND counted_by = ? ORDER BY completed_at DESC LIMIT 1`,
      [id, req.user.id]
    );
    res.json({ session });
  } catch (e) {
    console.error('Erro ao concluir contagem:', e);
    res.status(500).json({ error: 'Erro ao concluir contagem' });
  }
});

// Limpar e recontar (zera quantidades, preserva sessões)
router.post('/lists/:id/reset-counting', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { id } = req.params;
    const list = await dbGetAsync(
      `SELECT * FROM stock_lists WHERE id = ? AND company_id = ?`,
      [id, req.user.company_id]
    );
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    // Encerra sessão ativa sem completed_at (abandonada)
    await dbRunAsync(
      `UPDATE stock_counting_sessions SET completed_at = NULL WHERE list_id = ? AND completed_at IS NULL`,
      [id]
    );
    // Zera todas as quantidades, sabores e obs dos itens
    await dbRunAsync(
      `UPDATE stock_list_items SET quantity = NULL, flavor = NULL, notes = NULL WHERE list_id = ?`,
      [id]
    );
    res.json({ message: 'Lista limpa. Pronto para nova contagem.' });
  } catch (e) {
    console.error('Erro ao limpar lista:', e);
    res.status(500).json({ error: 'Erro ao limpar lista' });
  }
});

// Listar sessões de contagem da empresa (para dashboard)
router.get('/sessions', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { limit = 20 } = req.query;
    const sessions = await dbAllAsync(
      `SELECT scs.*, sl.name as list_name, sl.type as list_type
       FROM stock_counting_sessions scs
       LEFT JOIN stock_lists sl ON scs.list_id = sl.id
       WHERE scs.company_id = ? AND scs.completed_at IS NOT NULL
       ORDER BY scs.completed_at DESC
       LIMIT ?`,
      [req.user.company_id, parseInt(limit)]
    );
    res.json(sessions);
  } catch (e) {
    console.error('Erro ao obter sessões:', e);
    res.status(500).json({ error: 'Erro ao obter sessões' });
  }
});

// ── MOVIMENTOS MANUAIS ───────────────────────────────────────────────

router.get('/movements', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { product_id, type, limit = 100 } = req.query;
    let sql = `
      SELECT sm.*, p.name as product_name, p.unit as product_unit, u.name as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.company_id = ?`;
    const params = [req.user.company_id];
    if (product_id) { sql += ' AND sm.product_id = ?'; params.push(product_id); }
    if (type) { sql += ' AND sm.type = ?'; params.push(type); }
    sql += ' ORDER BY sm.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    res.json(await dbAllAsync(sql, params));
  } catch (e) {
    console.error('Erro ao listar movimentos:', e);
    res.status(500).json({ error: 'Erro ao listar movimentos' });
  }
});

router.post('/movements', async (req, res) => {
  if (!guardCompany(req, res)) return;
  try {
    const { product_id, type, quantity, reason } = req.body;
    if (!product_id || !type || quantity === undefined)
      return res.status(400).json({ error: 'Produto, tipo e quantidade são obrigatórios' });
    if (!['entrada', 'saida', 'ajuste'].includes(type))
      return res.status(400).json({ error: 'Tipo inválido. Use: entrada, saida ou ajuste' });

    const product = await dbGetAsync(`SELECT * FROM products WHERE id = ? AND company_id = ?`, [product_id, req.user.company_id]);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    const prev = parseFloat(product.current_stock) || 0;
    const qty = parseFloat(quantity);
    const newStock = type === 'entrada' ? prev + qty : type === 'saida' ? Math.max(0, prev - qty) : qty;
    const now = new Date().toISOString();

    await withTransaction(async (txn) => {
      await txn.run(
        `INSERT INTO stock_movements (id, product_id, company_id, type, quantity, previous_stock, new_stock, reason, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), product_id, req.user.company_id, type, qty, prev, newStock, reason || null, req.user.id, now]
      );
      await txn.run(`UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?`, [newStock, now, product_id]);
    });

    res.status(201).json({ message: 'Movimento registrado', new_stock: newStock });
  } catch (e) {
    console.error('Erro ao registrar movimento:', e);
    res.status(500).json({ error: 'Erro ao registrar movimento' });
  }
});

export default router;
