import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Routes
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import checklistRoutes from './routes/checklists.js';
import executionRoutes from './routes/executions.js';
import qrcodeRoutes from './routes/qrcode.js';
import usersRoutes from './routes/users.js';
import rolesRoutes from './routes/roles.js';
import paymentsRoutes from './routes/payments.js';
import uploadsRoutes from './routes/uploads.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';
import stockRoutes from './routes/stock.js';

// Database
import { initDatabase, dbRunAsync, dbGetAsync, runOneTimeMigrations } from './database/init.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Permitir subdominios do render em producao
    if (process.env.NODE_ENV === 'production' && origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    console.warn(`[CORS] Origem bloqueada: ${origin}`);
    return callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true
}));

// Rate limiting (desativado em desenvolvimento)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requisições por minuto
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  skip: () => process.env.NODE_ENV === 'development' // Pula em desenvolvimento
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos de upload
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Endpoint para criar primeiro usuario master (executar uma vez) - ANTES das rotas protegidas
app.post('/api/admin/create-master', async (req, res) => {
  try {
    const { email, secret } = req.body;
    
    // Verificar secret para proteger o endpoint
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    // Verificar se usuario existe
    const user = await dbGetAsync(`SELECT id, email, name FROM users WHERE email = ?`, [email.toLowerCase()]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Tornar master
    await dbRunAsync(`UPDATE users SET is_master = 1 WHERE id = ?`, [user.id]);
    
    res.json({ 
      success: true, 
      message: `Usuário ${user.name} (${user.email}) agora é master!` 
    });
  } catch (error) {
    console.error('Erro ao criar master:', error);
    res.status(500).json({ error: 'Erro ao criar master' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/stock', stockRoutes);

// Health check (tambem usado pelo cron para manter servidor acordado)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Formulário de contato (com validação LGPD)
app.post('/api/contact', async (req, res) => {
  try {
    const validator = (await import('validator')).default;
    let { name, email, phone, subject, message } = req.body;

    // Validações
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Sanitização dos dados (proteção contra XSS)
    name = validator.escape(validator.trim(name));
    email = validator.normalizeEmail(email) || email;
    phone = validator.trim(phone).replace(/[^\d\s\-\(\)\+]/g, '');
    subject = validator.escape(validator.trim(subject));
    message = validator.escape(validator.trim(message));

    // Validar email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validar telefone (mínimo 10 dígitos)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: 'Telefone inválido. Inclua o DDD.' });
    }

    // Limitar tamanho dos campos
    if (name.length > 100) name = name.substring(0, 100);
    if (subject.length > 200) subject = subject.substring(0, 200);
    if (message.length > 2000) message = message.substring(0, 2000);

    // Salvar no banco de dados
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    
    await dbRunAsync(`
      INSERT INTO contact_messages (id, name, email, phone, subject, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, name, email, phone, subject, message, new Date().toISOString()]);

    // Log para acompanhamento (sem dados sensíveis completos - LGPD)
    console.log('📩 Nova mensagem de contato:');
    console.log(`   ID: ${id}`);
    console.log(`   Assunto: ${subject}`);
    console.log(`   Data: ${new Date().toISOString()}`);

    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar mensagem de contato:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Endpoint para marcar usuarios existentes para trocar senha (executar uma vez)
app.post('/api/admin/force-password-migration', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Verificar secret para proteger o endpoint
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Marcar todos usuarios para trocar senha
    await dbRunAsync(`UPDATE users SET must_change_password = 1 WHERE must_change_password = 0 OR must_change_password IS NULL`);
    
    res.json({ 
      success: true, 
      message: 'Todos os usuarios foram marcados para trocar a senha no proximo login.' 
    });
  } catch (error) {
    console.error('Erro na migracao:', error);
    res.status(500).json({ error: 'Erro ao processar migracao' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Initialize database and start server
async function startServer() {
  // Validar variáveis de ambiente críticas antes de iniciar
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`❌ FATAL: Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`);
    console.error('   Defina-as no painel do Render (Environment) ou no arquivo .env local.');
    process.exit(1);
  }

  try {
    await initDatabase();
    await runOneTimeMigrations();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📋 CheckList App - Sistema de Gestão de Checklists`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      console.log(`🔧 Backend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
