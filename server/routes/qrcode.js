import express from 'express';
import QRCode from 'qrcode';
import { dbGet, dbRun } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Gerar QR Code para checklist
router.get('/generate/:checklistId', authenticateToken, async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { format = 'dataurl', size = 300 } = req.query;

    const checklist = dbGet('SELECT * FROM checklists WHERE id = ?', [checklistId]);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    const qrCodeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/execute/${checklistId}`;

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

    const checklist = dbGet('SELECT title FROM checklists WHERE id = ?', [checklistId]);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist não encontrado' });
    }

    const qrCodeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/execute/${checklistId}`;

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
      const checklist = dbGet('SELECT id, title FROM checklists WHERE id = ?', [checklistId]);
      
      if (checklist) {
        const qrCodeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/execute/${checklistId}`;
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

export default router;
