import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRunAsync, dbGetAsync, dbAllAsync } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  sendSubscriptionConfirmation, 
  sendPaymentReceived, 
  sendTrialActivated,
  sendSubscriptionCancelled 
} from '../services/emailService.js';

const router = express.Router();

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
      max_checklists: -1,
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
      SELECT id, name, plan, plan_expires_at, mp_subscription_id, is_blocked
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
    const hasExpiration = !!company.plan_expires_at;
    const isExpired = hasExpiration && new Date(company.plan_expires_at) < new Date();
    const isBlocked = !!company.is_blocked;

    const currentPlan = company.plan || null;
    const isTrialActive = currentPlan === 'trial' && hasExpiration && !isExpired;
    const isPaidActive = currentPlan && currentPlan !== 'trial' && !isExpired;
    const isActive = !isBlocked && (isTrialActive || isPaidActive);

    res.json({
      company_id: company.id,
      plan: currentPlan,
      plan_info: planInfo,
      expires_at: company.plan_expires_at,
      is_expired: isExpired,
      is_blocked: isBlocked,
      is_active: isActive,
      has_plan: !!currentPlan && hasExpiration,
      subscription: subscription
    });
  } catch (error) {
    console.error('Erro ao obter assinatura:', error);
    res.status(500).json({ error: 'Erro ao obter assinatura' });
  }
});

// Criar assinatura usando a API REST do Mercado Pago
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
      return res.status(404).json({ error: 'Empresa nao encontrada. Cadastre sua empresa primeiro.' });
    }

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    
    if (!accessToken || accessToken === 'TEST-ACCESS-TOKEN') {
      return res.status(500).json({ error: 'Token do Mercado Pago nao configurado' });
    }

    // Criar pre-approval (assinatura) usando fetch direto na API
    const subscriptionData = {
      reason: `CheckList App - Plano ${plan.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.price,
        currency_id: 'BRL'
      },
      back_url: `${process.env.FRONTEND_URL || 'https://checklist-pro.rhumarh.com'}/payment/success?plan=${plan_id}`,
      payer_email: user.email,
      external_reference: `${company.id}|${plan_id}|${uuidv4()}`
    };

    console.log('Criando assinatura MP:', JSON.stringify(subscriptionData));

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    const responseData = await mpResponse.json();

    console.log('Resposta MP:', JSON.stringify(responseData));

    if (!mpResponse.ok) {
      console.error('Erro MP:', responseData);
      return res.status(400).json({ 
        error: 'Erro ao criar assinatura no Mercado Pago', 
        details: responseData.message || responseData.error || 'Erro desconhecido'
      });
    }

    // Salvar assinatura pendente no banco
    const subscriptionId = uuidv4();
    await dbRunAsync(`
      INSERT INTO subscriptions (id, company_id, plan, status, mp_preapproval_id, price)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `, [subscriptionId, company.id, plan_id, responseData.id, plan.price]);

    res.json({
      subscription_id: subscriptionId,
      mp_id: responseData.id,
      init_point: responseData.init_point,
      sandbox_init_point: responseData.sandbox_init_point
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

    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (type === 'payment') {
      // Buscar dados do pagamento
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const paymentData = await paymentResponse.json();
      
      if (paymentData.status === 'approved') {
        const externalRef = paymentData.external_reference;
        if (externalRef) {
          const [companyId, planId] = externalRef.split('|');

          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await dbRunAsync(`
            UPDATE companies 
            SET plan = ?, plan_expires_at = ?, updated_at = ?
            WHERE id = ?
          `, [planId, expiresAt.toISOString(), new Date().toISOString(), companyId]);

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

          await dbRunAsync(`
            UPDATE subscriptions 
            SET status = 'active', start_date = ?, end_date = ?, updated_at = ?
            WHERE company_id = ? AND status = 'pending'
          `, [new Date().toISOString(), expiresAt.toISOString(), new Date().toISOString(), companyId]);

          // Enviar email de pagamento recebido
          try {
            const company = await dbGetAsync('SELECT * FROM companies WHERE id = ?', [companyId]);
            const owner = await dbGetAsync('SELECT * FROM users WHERE id = ?', [company?.owner_id]);
            
            if (owner && company) {
              const plan = PLANS[planId];
              await sendPaymentReceived(owner.email, {
                userName: owner.name,
                companyName: company.name,
                planName: plan?.name || planId,
                amount: paymentData.transaction_amount,
                paymentMethod: paymentData.payment_method_id,
                paymentDate: new Date().toISOString()
              });
            }
          } catch (emailError) {
            console.error('Erro ao enviar email de pagamento:', emailError);
          }
        }
      }
    } else if (type === 'subscription_preapproval' || type === 'subscription_authorized_payment') {
      // Buscar dados da assinatura
      const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const preapprovalData = await preapprovalResponse.json();
      
      if (preapprovalData.status === 'authorized') {
        const externalRef = preapprovalData.external_reference;
        if (externalRef) {
          const [companyId, planId] = externalRef.split('|');

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

          // Enviar email de confirmacao de assinatura
          try {
            const company = await dbGetAsync('SELECT * FROM companies WHERE id = ?', [companyId]);
            const owner = await dbGetAsync('SELECT * FROM users WHERE id = ?', [company?.owner_id]);
            
            if (owner && company) {
              const plan = PLANS[planId];
              await sendSubscriptionConfirmation(owner.email, {
                userName: owner.name,
                companyName: company.name,
                planName: plan?.name || planId,
                price: plan?.price || 0,
                expiresAt: expiresAt.toISOString()
              });
            }
          } catch (emailError) {
            console.error('Erro ao enviar email de confirmacao:', emailError);
          }
        }
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

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (company.mp_subscription_id) {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      try {
        await fetch(`https://api.mercadopago.com/preapproval/${company.mp_subscription_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'cancelled' })
        });
      } catch (e) {
        console.error('Erro ao cancelar no MP:', e);
      }
    }

    await dbRunAsync(`
      UPDATE subscriptions 
      SET status = 'cancelled', updated_at = ?
      WHERE company_id = ? AND status = 'active'
    `, [new Date().toISOString(), company.id]);

    // Enviar email de cancelamento
    try {
      if (user) {
        await sendSubscriptionCancelled(user.email, {
          userName: user.name,
          companyName: company.name,
          expiresAt: company.plan_expires_at
        });
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de cancelamento:', emailError);
    }

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

    const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);

    // Verificar se ja usou trial
    const hadTrial = await dbGetAsync(`
      SELECT * FROM subscriptions WHERE company_id = ? AND plan = 'trial'
    `, [company.id]);

    if (hadTrial) {
      return res.status(400).json({ error: 'Trial ja utilizado' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await dbRunAsync(`
      UPDATE companies 
      SET plan = 'trial', plan_expires_at = ?, updated_at = ?
      WHERE id = ?
    `, [expiresAt.toISOString(), new Date().toISOString(), company.id]);

    await dbRunAsync(`
      INSERT INTO subscriptions (id, company_id, plan, status, start_date, end_date)
      VALUES (?, ?, 'trial', 'active', ?, ?)
    `, [uuidv4(), company.id, new Date().toISOString(), expiresAt.toISOString()]);

    // Enviar email de trial ativado
    try {
      if (user) {
        await sendTrialActivated(user.email, {
          userName: user.name,
          companyName: company.name,
          expiresAt: expiresAt.toISOString()
        });
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de trial:', emailError);
    }

    res.json({ 
      message: 'Trial ativado!',
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Erro ao ativar trial:', error);
    res.status(500).json({ error: 'Erro ao ativar trial' });
  }
});

// Estatisticas de assinaturas (admin/master)
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Verificar se e admin (owner de alguma empresa) ou master
    const user = await dbGetAsync('SELECT is_master FROM users WHERE id = ?', [req.user.id]);
    const company = await dbGetAsync('SELECT * FROM companies WHERE owner_id = ?', [req.user.id]);
    
    if (!company && !user?.is_master) {
      return res.status(403).json({ error: 'Acesso negado. Apenas owners e masters podem acessar.' });
    }

    const stats = {
      total_subscriptions: 0,
      active_subscriptions: 0,
      trial_subscriptions: 0,
      cancelled_subscriptions: 0,
      total_revenue: 0,
      monthly_revenue: 0
    };

    // Total de assinaturas
    const totalSubs = await dbGetAsync('SELECT COUNT(*) as count FROM subscriptions');
    stats.total_subscriptions = totalSubs?.count || 0;

    // Assinaturas ativas
    const activeSubs = await dbGetAsync("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");
    stats.active_subscriptions = activeSubs?.count || 0;

    // Trials
    const trialSubs = await dbGetAsync("SELECT COUNT(*) as count FROM subscriptions WHERE plan = 'trial'");
    stats.trial_subscriptions = trialSubs?.count || 0;

    // Canceladas
    const cancelledSubs = await dbGetAsync("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'cancelled'");
    stats.cancelled_subscriptions = cancelledSubs?.count || 0;

    // Receita total
    const totalRevenue = await dbGetAsync("SELECT SUM(amount) as total FROM payments WHERE status = 'approved'");
    stats.total_revenue = totalRevenue?.total || 0;

    // Receita do mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = await dbGetAsync(
      "SELECT SUM(amount) as total FROM payments WHERE status = 'approved' AND paid_at >= ?",
      [startOfMonth.toISOString()]
    );
    stats.monthly_revenue = monthlyRevenue?.total || 0;

    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatisticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatisticas' });
  }
});

// Listar todas as assinaturas (admin/master)
router.get('/admin/subscriptions', authenticateToken, async (req, res) => {
  try {
    // Verificar se e admin (owner de alguma empresa) ou master
    const user = await dbGetAsync('SELECT is_master FROM users WHERE id = ?', [req.user.id]);
    const company = await dbGetAsync('SELECT * FROM companies WHERE owner_id = ?', [req.user.id]);
    
    if (!company && !user?.is_master) {
      return res.status(403).json({ error: 'Acesso negado. Apenas owners e masters podem acessar.' });
    }

    const subscriptions = await dbAllAsync(`
      SELECT 
        s.*,
        c.name as company_name,
        u.name as owner_name,
        u.email as owner_email
      FROM subscriptions s
      LEFT JOIN companies c ON s.company_id = c.id
      LEFT JOIN users u ON c.owner_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `);

    res.json(subscriptions);
  } catch (error) {
    console.error('Erro ao listar assinaturas:', error);
    res.status(500).json({ error: 'Erro ao listar assinaturas' });
  }
});

// Listar todos os pagamentos (admin/master)
router.get('/admin/payments', authenticateToken, async (req, res) => {
  try {
    // Verificar se e admin (owner de alguma empresa) ou master
    const user = await dbGetAsync('SELECT is_master FROM users WHERE id = ?', [req.user.id]);
    const company = await dbGetAsync('SELECT * FROM companies WHERE owner_id = ?', [req.user.id]);
    
    if (!company && !user?.is_master) {
      return res.status(403).json({ error: 'Acesso negado. Apenas owners e masters podem acessar.' });
    }

    const payments = await dbAllAsync(`
      SELECT 
        p.*,
        c.name as company_name
      FROM payments p
      LEFT JOIN companies c ON p.company_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    res.json(payments);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
});

export default router;
