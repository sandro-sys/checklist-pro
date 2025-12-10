import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import { dbRunAsync, dbGetAsync, dbAllAsync } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configurar Mercado Pago
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN'
});

const preApproval = new PreApproval(mpClient);
const payment = new Payment(mpClient);

// Planos disponiveis
const PLANS = {
  trial: {
    id: 'trial',
    name: 'Trial',
    price: 0,
    duration_days: 14,
    features: {
      max_checklists: 3,
      max_users: 2,
      history_days: 7
    }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 49.90,
    features: {
      max_checklists: 10,
      max_users: 5,
      history_days: 30
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99.90,
    features: {
      max_checklists: -1, // ilimitado
      max_users: -1,
      history_days: -1
    }
  }
};

// Obter planos disponiveis
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Obter status da assinatura da empresa
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const company = await dbGetAsync(`
      SELECT id, name, plan, plan_expires_at, mp_subscription_id 
      FROM companies 
      WHERE owner_id = ? OR id = ?
    `, [req.user.id, req.user.company_id]);

    if (!company) {
      return res.status(404).json({ error: 'Empresa nao encontrada' });
    }

    const subscription = await dbGetAsync(`
      SELECT * FROM subscriptions 
      WHERE company_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [company.id]);

    const planInfo = PLANS[company.plan] || PLANS.trial;
    const isExpired = company.plan_expires_at && new Date(company.plan_expires_at) < new Date();

    res.json({
      company_id: company.id,
      plan: company.plan || 'trial',
      plan_info: planInfo,
      expires_at: company.plan_expires_at,
      is_expired: isExpired,
      is_active: !isExpired && company.plan !== 'trial',
      subscription: subscription
    });
  } catch (error) {
    console.error('Erro ao obter assinatura:', error);
    res.status(500).json({ error: 'Erro ao obter assinatura' });
  }
});

// Criar assinatura (pre-approval) no Mercado Pago
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { plan_id } = req.body;

    if (!plan_id || !PLANS[plan_id]) {
      return res.status(400).json({ error: 'Plano invalido' });
    }

    if (plan_id === 'trial') {
      return res.status(400).json({ error: 'Trial nao requer pagamento' });
    }

    const plan = PLANS[plan_id];
    const company = await dbGetAsync(`
      SELECT * FROM companies WHERE owner_id = ?
    `, [req.user.id]);

    if (!company) {
      return res.status(404).json({ error: 'Empresa nao encontrada' });
    }

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);

    // Criar pre-approval (assinatura) no Mercado Pago
    const subscriptionData = {
      reason: `CheckList Pro - Plano ${plan.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.price,
        currency_id: 'BRL'
      },
      back_url: `${process.env.FRONTEND_URL || 'https://checklist-pro.onrender.com'}/pricing?status=success`,
      payer_email: user.email,
      external_reference: `${company.id}|${plan_id}|${uuidv4()}`
    };

    const response = await preApproval.create({ body: subscriptionData });

    // Salvar assinatura pendente no banco
    const subscriptionId = uuidv4();
    await dbRunAsync(`
      INSERT INTO subscriptions (id, company_id, plan, status, mp_preapproval_id, price)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `, [subscriptionId, company.id, plan_id, response.id, plan.price]);

    res.json({
      subscription_id: subscriptionId,
      mp_id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura', details: error.message });
  }
});

// Webhook do Mercado Pago
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Webhook MP recebido:', type, data);

    if (type === 'payment') {
      // Pagamento recebido
      const paymentData = await payment.get({ id: data.id });
      
      if (paymentData.status === 'approved') {
        const externalRef = paymentData.external_reference;
        const [companyId, planId] = externalRef.split('|');

        // Atualizar empresa com o plano
        const plan = PLANS[planId];
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await dbRunAsync(`
          UPDATE companies 
          SET plan = ?, plan_expires_at = ?, updated_at = ?
          WHERE id = ?
        `, [planId, expiresAt.toISOString(), new Date().toISOString(), companyId]);

        // Registrar pagamento
        await dbRunAsync(`
          INSERT INTO payments (id, company_id, mp_payment_id, amount, status, payment_method, paid_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(),
          companyId,
          paymentData.id.toString(),
          paymentData.transaction_amount,
          'approved',
          paymentData.payment_method_id,
          new Date().toISOString()
        ]);

        // Atualizar status da assinatura
        await dbRunAsync(`
          UPDATE subscriptions 
          SET status = 'active', start_date = ?, end_date = ?, updated_at = ?
          WHERE company_id = ? AND status = 'pending'
        `, [new Date().toISOString(), expiresAt.toISOString(), new Date().toISOString(), companyId]);
      }
    } else if (type === 'subscription_preapproval') {
      // Assinatura criada/atualizada
      const preApprovalData = await preApproval.get({ id: data.id });
      
      if (preApprovalData.status === 'authorized') {
        const externalRef = preApprovalData.external_reference;
        const [companyId, planId] = externalRef.split('|');

        const plan = PLANS[planId];
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await dbRunAsync(`
          UPDATE companies 
          SET plan = ?, plan_expires_at = ?, mp_subscription_id = ?, updated_at = ?
          WHERE id = ?
        `, [planId, expiresAt.toISOString(), data.id, new Date().toISOString(), companyId]);

        await dbRunAsync(`
          UPDATE subscriptions 
          SET status = 'active', mp_subscription_id = ?, start_date = ?, end_date = ?, updated_at = ?
          WHERE company_id = ? AND mp_preapproval_id = ?
        `, [data.id, new Date().toISOString(), expiresAt.toISOString(), new Date().toISOString(), companyId, data.id]);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro no webhook' });
  }
});

// Cancelar assinatura
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const company = await dbGetAsync(`
      SELECT * FROM companies WHERE owner_id = ?
    `, [req.user.id]);

    if (!company) {
      return res.status(404).json({ error: 'Empresa nao encontrada' });
    }

    if (company.mp_subscription_id) {
      try {
        await preApproval.update({
          id: company.mp_subscription_id,
          body: { status: 'cancelled' }
        });
      } catch (e) {
        console.error('Erro ao cancelar no MP:', e);
      }
    }

    // Manter o plano ate a data de expiracao
    await dbRunAsync(`
      UPDATE subscriptions 
      SET status = 'cancelled', updated_at = ?
      WHERE company_id = ? AND status = 'active'
    `, [new Date().toISOString(), company.id]);

    res.json({ message: 'Assinatura cancelada. Voce tera acesso ate o fim do periodo pago.' });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

// Historico de pagamentos
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    const company = await dbGetAsync(`
      SELECT id FROM companies WHERE owner_id = ? OR id = ?
    `, [req.user.id, req.user.company_id]);

    if (!company) {
      return res.status(404).json({ error: 'Empresa nao encontrada' });
    }

    const payments = await dbAllAsync(`
      SELECT * FROM payments 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `, [company.id]);

    res.json(payments);
  } catch (error) {
    console.error('Erro ao obter pagamentos:', error);
    res.status(500).json({ error: 'Erro ao obter pagamentos' });
  }
});

// Ativar trial
router.post('/activate-trial', authenticateToken, async (req, res) => {
  try {
    const company = await dbGetAsync(`
      SELECT * FROM companies WHERE owner_id = ?
    `, [req.user.id]);

    if (!company) {
      return res.status(404).json({ error: 'Empresa nao encontrada' });
    }

    // Verificar se ja usou trial
    const hadTrial = await dbGetAsync(`
      SELECT * FROM subscriptions WHERE company_id = ? AND plan = 'trial'
    `, [company.id]);

    if (hadTrial) {
      return res.status(400).json({ error: 'Trial ja utilizado' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 dias

    await dbRunAsync(`
      UPDATE companies 
      SET plan = 'trial', plan_expires_at = ?, updated_at = ?
      WHERE id = ?
    `, [expiresAt.toISOString(), new Date().toISOString(), company.id]);

    await dbRunAsync(`
      INSERT INTO subscriptions (id, company_id, plan, status, start_date, end_date)
      VALUES (?, ?, 'trial', 'active', ?, ?)
    `, [uuidv4(), company.id, new Date().toISOString(), expiresAt.toISOString()]);

    res.json({ 
      message: 'Trial ativado!',
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Erro ao ativar trial:', error);
    res.status(500).json({ error: 'Erro ao ativar trial' });
  }
});

export default router;
