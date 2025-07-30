import { Request, Response } from 'express';
import { WalletService } from '../services/walletService';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '../middleware/auth';



export class WalletController {
  private walletService: WalletService;

  constructor(db: Pool) {
    this.walletService = new WalletService(db);
  }
  public getWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      
      const result = await this.walletService.getWalletByUserId(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }

    } catch (error) {
      console.error('Get wallet controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public getWalletByChain = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const chainId = parseInt(req.params.chainId);

      if (!chainId || isNaN(chainId)) {
        res.status(400).json({
          success: false,
          message: 'Valid chain ID is required'
        });
        return;
      }

      const chainWallet = await this.walletService.getWalletByChain(userId, chainId);

      if (chainWallet) {
        res.status(200).json({
          success: true,
          message: 'Chain wallet retrieved successfully',
          data: chainWallet
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Chain wallet not found'
        });
      }

    } catch (error) {
      console.error('Get wallet by chain controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public updateTokenBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const { chainId, tokenAddress, balance, priceUsd } = req.body;

      if (!chainId || !tokenAddress || !balance) {
        res.status(400).json({
          success: false,
          message: 'Chain ID, token address, and balance are required'
        });
        return;
      }

      const success = await this.walletService.updateTokenBalance(
        userId,
        chainId,
        tokenAddress,
        balance,
        priceUsd
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Token balance updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update token balance'
        });
      }

    } catch (error) {
      console.error('Update token balance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public getTokenBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const { chainId, tokenAddress } = req.query;

      if (!chainId || !tokenAddress) {
        res.status(400).json({
          success: false,
          message: 'Chain ID and token address are required'
        });
        return;
      }

      const balance = await this.walletService.getTokenBalance(
        userId,
        parseInt(chainId as string),
        tokenAddress as string
      );

      if (balance) {
        res.status(200).json({
          success: true,
          message: 'Token balance retrieved successfully',
          data: balance
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Token not found in wallet'
        });
      }

    } catch (error) {
      console.error('Get token balance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public addTokenToChain = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const { chainId, token_address, token_symbol, token_name, decimals, balance, logo_uri } = req.body;

      if (!chainId || !token_address || !token_symbol || !token_name || decimals === undefined) {
        res.status(400).json({
          success: false,
          message: 'Chain ID, token address, symbol, name, and decimals are required'
        });
        return;
      }

      // Validate token address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(token_address)) {
        res.status(400).json({
          success: false,
          message: 'Invalid token address format'
        });
        return;
      }

      const success = await this.walletService.addTokenToChain(userId, chainId, {
        token_address,
        token_symbol,
        token_name,
        decimals: parseInt(decimals),
        balance: balance || '0',
        logo_uri
      });

      if (success) {
        res.status(201).json({
          success: true,
          message: 'Token added to chain successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to add token to chain'
        });
      }

    } catch (error) {
      console.error('Add token to chain controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public validateSwapRequirement = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const { chainId, tokenAddress, requiredAmount } = req.body;

      if (!chainId || !tokenAddress || !requiredAmount) {
        res.status(400).json({
          success: false,
          message: 'Chain ID, token address, and required amount are required'
        });
        return;
      }

      const balance = await this.walletService.getTokenBalance(
        userId,
        chainId,
        tokenAddress
      );

      if (!balance) {
        res.status(200).json({
          success: true,
          message: 'Validation complete',
          data: {
            hasToken: false,
            hasSufficientBalance: false,
            currentBalance: '0',
            requiredAmount
          }
        });
        return;
      }

      const currentBalance = BigInt(balance.balance);
      const required = BigInt(requiredAmount);
      const hasSufficientBalance = currentBalance >= required;

      res.status(200).json({
        success: true,
        message: 'Validation complete',
        data: {
          hasToken: true,
          hasSufficientBalance,
          currentBalance: balance.balance,
          currentBalanceFormatted: balance.formatted_balance,
          requiredAmount,
          shortfall: hasSufficientBalance ? '0' : (required - currentBalance).toString()
        }
      });

    } catch (error) {
      console.error('Validate swap requirement error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public getWalletSummaryWithPrices = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const result = await this.walletService.getWalletByUserId(userId);

      if (!result.success || !result.data) {
        res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
        return;
      }

      const wallet = result.data.wallet;
      
      // Enhanced summary with token counts and chain info
      const summary = {
        wallet_id: wallet.id,
        total_chains: Object.keys(wallet.chains).length,
        total_tokens: Object.values(wallet.chains).reduce((total: number, chain: any) => {
          return total + chain.tokens.length;
        }, 0),
        total_usd_value: result.data.total_usd_value,
        chains: Object.entries(wallet.chains).map(([chainId, chainData]: [string, any]) => ({
          chain_id: parseInt(chainId),
          chain_name: chainData.chain_name,
          chain_symbol: chainData.chain_symbol,
          token_count: chainData.tokens.length,
          total_usd_value: chainData.total_usd_value,
          tokens: chainData.tokens.map((token: any) => ({
            address: token.token_address,
            symbol: token.token_symbol,
            name: token.token_name,
            balance: token.formatted_balance,
            usd_value: token.usd_value || '0',
            logo_uri: token.logo_uri
          }))
        }))
      };

      res.status(200).json({
        success: true,
        message: 'Wallet summary retrieved successfully',
        data: summary
      });

    } catch (error) {
      console.error('Get wallet summary with prices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public simulateSwap = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const {
        fromChainId,
        fromTokenAddress,
        fromAmount,
        toChainId,
        toTokenAddress,
        toAmount
      } = req.body;

      if (!fromChainId || !fromTokenAddress || !fromAmount || 
          !toChainId || !toTokenAddress || !toAmount) {
        res.status(400).json({
          success: false,
          message: 'All swap parameters are required'
        });
        return;
      }

      const success = await this.walletService.simulateSwap(
        userId,
        fromChainId,
        fromTokenAddress,
        fromAmount,
        toChainId,
        toTokenAddress,
        toAmount
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Swap simulated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to simulate swap'
        });
      }

    } catch (error) {
      console.error('Simulate swap controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public refreshPrices = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const success = await this.walletService.refreshWalletPrices(userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Wallet prices refreshed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to refresh wallet prices'
        });
      }

    } catch (error) {
      console.error('Refresh prices controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
  
}