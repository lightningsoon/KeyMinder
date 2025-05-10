import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效或已过期' });
    }
    
    req.user = user as { id: string; email: string; username: string };
    next();
  });
};
