import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { WalletService } from '../services/walletService';
import { AuthService } from '../services/authService';
import { LoginRequest, RegisterRequest } from '../models/User';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AuthController {
  private db: Pool;
  private walletService: WalletService;
  private authService: AuthService;

  constructor(db: Pool) {
    this.db = db;
    this.walletService = new WalletService(db);
    this.authService = new AuthService(db);
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password }: RegisterRequest = req.body;

      // Basic validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
        return;
      }

      // Password validation
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
        return;
      }

      const result = await this.authService.register({ email, password });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password }: LoginRequest = req.body;

      // Basic validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      const result = await this.authService.login({ email, password });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }

    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

   public getProfile = async (req: Request, res: Response,next:NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const {token} = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      } 

      
      const decoded = this.authService.verifyToken(token);

      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
        return;
      }

      (req as any).user = decoded;
      next();

    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const result = await this.authService.refreshToken(userId);

      if (result) {
        res.status(200).json({
          success: true,
          message: 'Token refreshed successfully',
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to refresh token'
        });
      }

    } catch (error) {
      console.error('Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public getProfileWithWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await this.authService.getUserWithWalletInfo(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile with wallet info retrieved successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Get profile with wallet controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}