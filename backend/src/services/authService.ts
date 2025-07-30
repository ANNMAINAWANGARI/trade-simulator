import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/User';
import { dbHelpers } from '../database/connection';


export class AuthService {
  private db: Pool;
  private saltRounds = 12;
  constructor(db:Pool){
    this.db = db;
  }

  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      await this.db.query('BEGIN');

      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, this.saltRounds);

      // Generate wallet ID
      const walletId = dbHelpers.generateId();

      // Create user
      const userResult = await this.db.query(`
        INSERT INTO users (email, password_hash, wallet_id)
        VALUES ($1, $2, $3)
        RETURNING id, email, wallet_id, created_at, updated_at
      `, [userData.email, passwordHash, walletId]);

      const user = userResult.rows[0];

      // Create wallet with initial chain setup
      const initialWalletData = dbHelpers.createInitialWalletData();
      
      await this.db.query(`
        INSERT INTO wallets (id, user_id, chains)
        VALUES ($1, $2, $3)
      `, [walletId, user.id, JSON.stringify(initialWalletData)]);

      await this.db.query('COMMIT');

      // Generate JWT token with additional wallet info
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          walletId: user.wallet_id,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'User registered successfully with initial wallet setup',
        data: {
          user: {
            id: user.id,
            email: user.email,
            wallet_id: user.wallet_id,
            created_at: user.created_at,
            updated_at: user.updated_at
          },
          token
        }
      };

    } catch (error) {
      await this.db.query('ROLLBACK');
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    } 
  }
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const userResult = await this.db.query(
        'SELECT id, email, password_hash, wallet_id, created_at, updated_at FROM users WHERE email = $1',
        [credentials.email]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      const user = userResult.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Generate JWT token with additional info
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          walletId: user.wallet_id,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            wallet_id: user.wallet_id,
            created_at: user.created_at,
            updated_at: user.updated_at
          },
          token
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }
  public async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const result = await this.db.query(
        'SELECT id, email, wallet_id, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }
  public async getUserWithWalletInfo(userId: string): Promise<any | null> {
    try {
      const result = await this.db.query(`
        SELECT 
          u.id,
          u.email,
          u.wallet_id,
          u.created_at,
          u.updated_at,
          w.chains
        FROM users u
        LEFT JOIN wallets w ON u.wallet_id = w.id
        WHERE u.id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const chains = user.chains || {};
      
      // Calculate some basic wallet stats
      const totalChains = Object.keys(chains).length;
      const totalTokens = Object.values(chains).reduce((total: number, chain: any) => {
        return total + (chain.tokens ? chain.tokens.length : 0);
      }, 0);

      return {
        id: user.id,
        email: user.email,
        wallet_id: user.wallet_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
        wallet_stats: {
          total_chains: totalChains,
          total_tokens: totalTokens,
          has_wallet: totalChains > 0
        }
      };
    } catch (error) {
      console.error('Get user with wallet info error:', error);
      return null;
    }
  }
  public verifyToken(token: string): { userId: string; email: string; walletId: string; iat?: number } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        walletId: decoded.walletId,
        iat: decoded.iat
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      // Get current password hash
      const userResult = await this.db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const user = userResult.rows[0];

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      await this.db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password. Please try again.'
      };
    }
  }
  public async refreshToken(userId: string): Promise<{ token: string } | null> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return null;
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          walletId: user.wallet_id,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return { token };
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  }
}