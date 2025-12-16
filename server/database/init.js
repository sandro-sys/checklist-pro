import pg from 'pg';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../../data');
const dbPath = join(dataDir, 'checklist.db');

let db = null;
let SQL = null;
let pgPool = null;
export const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

export async function getDb() {
  if (isProduction) {
    return pgPool;
  }
  if (!db) {
    await initDatabase();
  }
  return db;
}

export async function initDatabase() {
  if (isProduction) {
    // PostgreSQL para producao
    await initPostgres();
  } else {
    // SQLite para desenvolvimento local
    await initSQLite();
  }
}

async function initPostgres() {
  const { Pool } = pg;
  
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  });

  // Testar conexao
  try {
    await pgPool.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error);
    throw error;
  }

  // Criar tabelas
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      company_id TEXT NOT NULL,
      permissions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role_type TEXT DEFAULT 'user',
      role_id TEXT,
      company_id TEXT,
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      lgpd_consent INTEGER DEFAULT 0,
      lgpd_consent_date TEXT,
      last_login TEXT,
      must_change_password INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migracao: adicionar coluna must_change_password se nao existir
  try {
    await pgPool.query(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`);
  } catch (e) {
    // Coluna ja existe
  }

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cnpj TEXT UNIQUE,
      email TEXT,
      phone TEXT,
      address TEXT,
      logo TEXT,
      owner_id TEXT NOT NULL,
      plan TEXT DEFAULT 'trial',
      plan_expires_at TIMESTAMP,
      mp_subscription_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS checklist_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      company_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      company_id TEXT NOT NULL,
      periodicity TEXT DEFAULT 'daily',
      schedule_time TEXT,
      schedule_days TEXT,
      is_active INTEGER DEFAULT 1,
      qr_code TEXT,
      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      checklist_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER DEFAULT 0,
      is_required INTEGER DEFAULT 1,
      item_type TEXT DEFAULT 'checkbox',
      options TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS checklist_executions (
      id TEXT PRIMARY KEY,
      checklist_id TEXT NOT NULL,
      executed_by TEXT NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      status TEXT DEFAULT 'in_progress',
      notes TEXT
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS execution_responses (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      response TEXT,
      is_checked INTEGER DEFAULT 0,
      is_not_applicable INTEGER DEFAULT 0,
      notes TEXT,
      responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_invites (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      company_id TEXT NOT NULL,
      role_id TEXT,
      invited_by TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de pagamentos/assinaturas
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      mp_subscription_id TEXT,
      mp_preapproval_id TEXT,
      price DECIMAL(10,2),
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      subscription_id TEXT,
      company_id TEXT NOT NULL,
      mp_payment_id TEXT,
      amount DECIMAL(10,2),
      status TEXT,
      payment_method TEXT,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tabelas PostgreSQL criadas com sucesso!');
}

async function initSQLite() {
  // Initialize SQL.js
  SQL = await initSqlJs();

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      company_id TEXT NOT NULL,
      permissions TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role_type TEXT DEFAULT 'user',
      role_id TEXT,
      company_id TEXT,
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      lgpd_consent INTEGER DEFAULT 0,
      lgpd_consent_date TEXT,
      last_login TEXT,
      must_change_password INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cnpj TEXT UNIQUE,
      email TEXT,
      phone TEXT,
      address TEXT,
      logo TEXT,
      owner_id TEXT NOT NULL,
      plan TEXT DEFAULT 'trial',
      plan_expires_at TEXT,
      mp_subscription_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checklist_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      company_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      company_id TEXT NOT NULL,
      periodicity TEXT DEFAULT 'daily',
      schedule_time TEXT,
      schedule_days TEXT,
      is_active INTEGER DEFAULT 1,
      qr_code TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      checklist_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER DEFAULT 0,
      is_required INTEGER DEFAULT 1,
      item_type TEXT DEFAULT 'checkbox',
      options TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checklist_executions (
      id TEXT PRIMARY KEY,
      checklist_id TEXT NOT NULL,
      executed_by TEXT NOT NULL,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      status TEXT DEFAULT 'in_progress',
      notes TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS execution_responses (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      response TEXT,
      is_checked INTEGER DEFAULT 0,
      is_not_applicable INTEGER DEFAULT 0,
      notes TEXT,
      responded_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_invites (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      company_id TEXT NOT NULL,
      role_id TEXT,
      invited_by TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      mp_subscription_id TEXT,
      mp_preapproval_id TEXT,
      price REAL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      subscription_id TEXT,
      company_id TEXT NOT NULL,
      mp_payment_id TEXT,
      amount REAL,
      status TEXT,
      payment_method TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migracao: adicionar colunas se nao existirem
  try {
    db.run(`ALTER TABLE companies ADD COLUMN plan TEXT DEFAULT 'trial'`);
  } catch (e) {}
  try {
    db.run(`ALTER TABLE companies ADD COLUMN plan_expires_at TEXT`);
  } catch (e) {}
  try {
    db.run(`ALTER TABLE companies ADD COLUMN mp_subscription_id TEXT`);
  } catch (e) {}
  try {
    db.run(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`);
  } catch (e) {}

  saveDatabase();
  console.log('✅ Banco de dados SQLite inicializado com sucesso!');
}

export function saveDatabase() {
  if (db && !isProduction) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

// Helper functions que funcionam tanto com SQLite quanto PostgreSQL
export async function dbRunAsync(sql, params = []) {
  if (isProduction) {
    // PostgreSQL usa $1, $2, etc. em vez de ?
    const pgSql = sql.replace(/\?/g, (_, i) => `$${params.indexOf(_) + 1}`);
    let paramIndex = 0;
    const finalSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
    await pgPool.query(finalSql, params);
  } else {
    db.run(sql, params);
    saveDatabase();
  }
}

export async function dbGetAsync(sql, params = []) {
  if (isProduction) {
    let paramIndex = 0;
    const finalSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
    const result = await pgPool.query(finalSql, params);
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
}

export async function dbAllAsync(sql, params = []) {
  if (isProduction) {
    let paramIndex = 0;
    const finalSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
    const result = await pgPool.query(finalSql, params);
    return result.rows;
  } else {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

// Funcoes sincronas para compatibilidade (apenas SQLite local)
export function dbRun(sql, params = []) {
  if (isProduction) {
    throw new Error('Use dbRunAsync em producao');
  }
  db.run(sql, params);
  saveDatabase();
}

export function dbGet(sql, params = []) {
  if (isProduction) {
    throw new Error('Use dbGetAsync em producao');
  }
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function dbAll(sql, params = []) {
  if (isProduction) {
    throw new Error('Use dbAllAsync em producao');
  }
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}
