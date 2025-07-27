import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { WalletService } from '../services/walletService';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AuthController {
  private db: Pool;
  private walletService: WalletService;

  constructor(db: Pool) {
    this.db = db;
    this.walletService = new WalletService(db);
  }

  // Register new user
  register = async (req: Request, res: Response) => {
    try {
      console.log('🔍 Incoming body in register controller:', req.body);

      const { email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await this.db.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
        [email, username, passwordHash]
      );

      const user = newUser.rows[0];

      // Create default wallet for new user
      const defaultWallet = await this.walletService.createWallet(user.id, 1, 'Main Wallet');

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at
          },
          defaultWallet,
          token
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Login user
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user
      const userResult = await this.db.query(
        'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Get user's wallets
      const wallets = await this.walletService.getUserWallets(user.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at
          },
          wallets,
          token
        },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Refresh token
  refreshToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
      
      // Generate new token
      const newToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  };

  // Get current user
  getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      const userResult = await this.db.query(
        'SELECT id, email, username, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];
      const wallets = await this.walletService.getUserWallets(userId);

      res.json({
        success: true,
        data: {
          user,
          wallets
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}