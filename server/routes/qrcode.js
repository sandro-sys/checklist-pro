import express from 'express';
import QRCode from 'qrcode';
import { dbGetAsync } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://checklist-pro.onrender.com';

const router = express.Router();

// Gerar QR Code para checklist
router.get('/generate/:checklistId', authenticateToken, async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { format = 'dataurl', size = 300 } = req.query;

    const checklist = await dbGetAsync('SELECT * FROM checklists WHERE id = ?', [checklistId]);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    const qrCodeUrl = `${FRONTEND_URL}/execute/${checklistId}`;

    const options = {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    };

    if (format === 'svg') {
      const svg = await QRCode.toString(qrCodeUrl, { ...options, type: 'svg' });
      res.type('svg').send(svg);
    } else if (format === 'png') {
      const buffer = await QRCode.toBuffer(qrCodeUrl, { ...options, type: 'png' });
      res.type('png').send(buffer);
    } else {
      const dataUrl = await QRCode.toDataURL(qrCodeUrl, options);
      res.json({ 
        qr_code: dataUrl,
        url: qrCodeUrl,
        checklist_title: checklist.title
      });
    }
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

// Baixar QR Code como imagem
router.get('/download/:checklistId', authenticateToken, async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { size = 500 } = req.query;

    const checklist = await dbGetAsync('SELECT title FROM checklists WHERE id = ?', [checklistId]);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    const qrCodeUrl = `${FRONTEND_URL}/execute/${checklistId}`;

    const buffer = await QRCode.toBuffer(qrCodeUrl, {
      width: parseInt(size),
      margin: 3,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    });

    const filename = `qrcode-${checklist.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao baixar QR Code:', error);
    res.status(500).json({ error: 'Erro ao baixar QR Code' });
  }
});

// Gerar múltiplos QR Codes
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { checklist_ids } = req.body;

    if (!checklist_ids || !Array.isArray(checklist_ids)) {
      return res.status(400).json({ error: 'Lista de IDs de checklists é obrigatória' });
    }

    const results = [];

    for (const checklistId of checklist_ids) {
      const checklist = await dbGetAsync('SELECT id, title FROM checklists WHERE id = ?', [checklistId]);
      
      if (checklist) {
        const qrCodeUrl = `${FRONTEND_URL}/execute/${checklistId}`;
        const qrCode = await QRCode.toDataURL(qrCodeUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#1a1a2e', light: '#ffffff' }
        });

        results.push({
          checklist_id: checklistId,
          title: checklist.title,
          qr_code: qrCode,
          url: qrCodeUrl
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Erro ao gerar QR Codes em lote:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Codes' });
  }
});

// QR Code para lista de estoque (compartilhamento público)
router.get('/stock/:listId', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const { size = 280 } = req.query;

    const list = await dbGetAsync(
      'SELECT id, name FROM stock_lists WHERE id = ? AND company_id = ?',
      [listId, req.user.company_id]
    );
    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    const url = `${FRONTEND_URL}/contar/${listId}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: parseInt(size),
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    res.json({ qr_code: dataUrl, url, list_name: list.name });
  } catch (e) {
    console.error('Erro ao gerar QR para lista de estoque:', e);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

export default router;
