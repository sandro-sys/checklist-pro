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

// Database
import { initDatabase, dbRunAsync } from './database/init.js';

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
    // Permitir requests sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Em producao, permitir qualquer subdominio do render
    if (process.env.NODE_ENV === 'production' && origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true); // Temporariamente permitir todos
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/payments', paymentsRoutes);

// Health check (tambem usado pelo cron para manter servidor acordado)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Formulário de contato
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Salvar no banco de dados
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    
    await dbRunAsync(`
      INSERT INTO contact_messages (id, name, email, phone, subject, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, name, email, phone, subject, message, new Date().toISOString()]);

    // Log para acompanhamento
    console.log('📩 Nova mensagem de contato:');
    console.log(`   Nome: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Telefone: ${phone}`);
    console.log(`   Assunto: ${subject}`);
    console.log(`   Mensagem: ${message.substring(0, 100)}...`);

    // TODO: Enviar email de notificação para o admin

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
    if (secret !== process.env.ADMIN_SECRET && secret !== 'migrate-passwords-2024') {
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
  try {
    await initDatabase();
    
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
