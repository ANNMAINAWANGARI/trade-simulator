import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { AuthService } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    walletId: string;
  };
}


export const createAuthMiddleware = (db: Pool) => {
  const authService = new AuthService(db);

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const decoded = authService.verifyToken(token);

      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
        return;
      }

      
      (req as AuthenticatedRequest).user = decoded;
      next();

    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};