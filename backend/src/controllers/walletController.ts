import { Request, Response } from 'express';
import { WalletService } from '../services/walletService';
import { Pool } from 'pg';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class WalletController {
  private walletService: WalletService;

  constructor(db: Pool) {
    this.walletService = new WalletService(db);
  }
  // Create a new virtual wallet
  createWallet = async (req: AuthenticatedRequest, res: Response) => {
    try{
      const { chainId, name } = req.body;
      const userId = req.userId!;

      const wallet = await this.walletService.createWallet(
        userId, 
        chainId || 1, 
        name || 'Main Wallet'
      );

      res.status(201).json({
        success: true,
        data: wallet,
        message: 'Virtual wallet created successfully'
      });
    }catch(error){
        console.error('Error creating wallet:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to create wallet',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
    }
  }
  // Get user's wallets
  getUserWallets = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const wallets = await this.walletService.getUserWallets(userId);

      res.json({
        success: true,
        data: wallets
      });
    } catch (error) {
      console.error('Error fetching wallets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  // Get specific wallet details
  getWalletDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { walletId } = req.params;
      const userId = req.userId!;

      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const balances = await this.walletService.getWalletBalances(walletId);
      const summary = await this.walletService.getPortfolioSummary(walletId);

      res.json({
        success: true,
        data: {
          wallet,
          balances,
          summary
        }
      });
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  // Get wallet balances
  getWalletBalances = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { walletId } = req.params;
      const userId = req.userId!;

      // Verify wallet ownership
      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const balances = await this.walletService.getWalletBalances(walletId);
      const totalValue = await this.walletService.getWalletTotalValue(walletId);

      res.json({
        success: true,
        data: {
          balances,
          totalValue
        }
      });
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet balances',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  // Get transaction history
  getTransactionHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { walletId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.userId!;

      // Verify wallet ownership
      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const transactions = await this.walletService.getTransactionHistory(
        walletId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  // Get portfolio summary
  getPortfolioSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { walletId } = req.params;
      const userId = req.userId!;

      // Verify wallet ownership
      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const summary = await this.walletService.getPortfolioSummary(walletId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch portfolio summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  // Validate balance for trade
  validateBalance = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { walletId } = req.params;
      const { tokenAddress, amount } = req.body;
      const userId = req.userId!;

      // Verify wallet ownership
      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const isValid = await this.walletService.validateTradeBalance(walletId, tokenAddress, amount);

      res.json({
        success: true,
        data: {
          isValid,
          tokenAddress,
          amount
        }
      });
    } catch (error) {
      console.error('Error validating balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate balance',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}