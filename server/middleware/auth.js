import jwt from 'jsonwebtoken';
import { dbGetAsync } from '../database/init.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    
    try {
      // Buscar dados atualizados do usuário no banco (incluindo company_id)
      const user = await dbGetAsync(`
        SELECT u.id, u.email, u.name, u.role_type, u.company_id,
               c.id as owner_company_id
        FROM users u
        LEFT JOIN companies c ON c.owner_id = u.id
        WHERE u.id = ?
      `, [decoded.id]);
      
      if (!user) {
        return res.status(403).json({ error: 'Usuário não encontrado' });
      }
      
      // Usar company_id do usuário ou da empresa que ele é dono
      req.user = {
        ...decoded,
        company_id: user.company_id || user.owner_company_id
      };
      
      next();
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      return res.status(500).json({ error: 'Erro interno de autenticação' });
    }
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão negada' });
    }
    
    next();
  };
}

export function requireCompanyAccess(req, res, next) {
  const companyId = req.params.companyId || req.body.company_id;
  
  if (!companyId) {
    return next();
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.company_id !== companyId) {
    return res.status(403).json({ error: 'Acesso negado a esta empresa' });
  }

  next();
}
