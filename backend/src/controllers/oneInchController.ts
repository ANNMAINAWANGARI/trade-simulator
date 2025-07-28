import { Request, Response } from 'express';
import { OneInchService } from '../services/oneInchService';
import { WalletService } from '../services/walletService';
import { Pool } from 'pg';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class OneInchController {
  private oneInchService: OneInchService;
  private walletService: WalletService;

  constructor(db: Pool) {
    this.oneInchService = new OneInchService(db);
    this.walletService = new WalletService(db);
  }

  getTokens = async (req: Request, res: Response) => {
    try {
      const { chainId = '1' } = req.params;
      const tokens = await this.oneInchService.getTokensCached(parseInt(chainId));
      
      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supported tokens',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getSpotPrice = async (req: Request, res: Response) => {
    try {
      const { chainId = '1', tokenAddress } = req.params;
      const { currency } = req.query;
      
      const price = await this.oneInchService.getSpotPrice(
        parseInt(chainId),
        tokenAddress,
        currency as string
      );
      
      res.json({
        success: true,
        data: {
          tokenAddress,
          price,
          currency: currency || 'native'
        }
      });
    } catch (error) {
      console.error('Error fetching spot price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch token price',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getGasPrice = async (req: Request, res: Response) => {
    try {
      const { chainId = '1' } = req.params;
      const gasPrice = await this.oneInchService.getGasPrice(parseInt(chainId));
      
      res.json({
        success: true,
        data: gasPrice
      });
    } catch (error) {
      console.error('Error fetching gas price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gas price',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getMarketData = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chainId = '1' } = req.params;
      const { walletId } = req.query;
      
      let walletAddress: string | undefined;
      
      // If walletId provided, get the wallet address
      if (walletId && req.userId) {
        const wallet = await this.walletService.getWalletById(walletId as string, req.userId);
        walletAddress = wallet?.address;
      }
      
      const marketData = await this.oneInchService.getMarketData(
        parseInt(chainId),
        walletAddress
      );
      
      res.json({
        success: true,
        data: marketData
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch market data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getQuote = async (req: Request, res: Response) => {
    try {
      const { chainId = '1' } = req.params;
      const { src, dst, amount, ...otherParams } = req.query;
      
      if (!src || !dst || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: src, dst, amount'
        });
      }
      
      const quote = await this.oneInchService.getQuote(parseInt(chainId), {
        src: src as string,
        dst: dst as string,
        amount: amount as string,
        ...otherParams
      });
      
      res.json({
        success: true,
        data: quote
      });
    } catch (error) {
      console.error('Error fetching quote:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch swap quote',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  simulateSwap = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        walletId,
        chainId = 1,
        fromToken,
        toToken,
        amount,
        slippage = 1
      } = req.body;
      
      if (!walletId || !fromToken || !toToken || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: walletId, fromToken, toToken, amount'
        });
      }
      
      const userId = req.userId!;
      
      // Verify wallet ownership
      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }
      
      // Validate balance
      const hasBalance = await this.walletService.validateTradeBalance(
        walletId,
        fromToken,
        amount
      );
      
      if (!hasBalance) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance for this trade'
        });
      }
      
      // Get simulation data from 1inch
      const simulation = await this.oneInchService.simulateSwap(
        chainId,
        fromToken,
        toToken,
        amount,
        wallet.address,
        slippage
      );
      
      res.json({
        success: true,
        data: {
          ...simulation,
          walletId,
          canExecute: hasBalance
        }
      });
    } catch (error) {
      console.error('Error simulating swap:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to simulate swap',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  executeVirtualSwap = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        walletId,
        chainId = 1,
        fromToken,
        toToken,
        amount,
        slippage = 1,
        fromTokenSymbol,
        toTokenSymbol
      } = req.body;
      
      const userId = req.userId!;
      
      // Verify wallet ownership
      const wallet = await this.walletService.getWalletById(walletId, userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }
      
      // Get real 1inch data for the trade
      const simulation = await this.oneInchService.simulateSwap(
        chainId,
        fromToken,
        toToken,
        amount,
        wallet.address,
        slippage
      );
      
      // Execute virtual trade using real 1inch data
      const transaction = await this.walletService.executeVirtualTrade({
        walletId,
        fromTokenAddress: fromToken,
        fromTokenSymbol: fromTokenSymbol || simulation.quote.fromToken.symbol,
        fromAmount: amount,
        toTokenAddress: toToken,
        toTokenSymbol: toTokenSymbol || simulation.quote.toToken.symbol,
        toAmount: simulation.quote.toAmount,
        gasUsed: simulation.swap.tx.gas.toString(),
        gasPrice: simulation.gasPrice,
        slippage: slippage.toString(),
        protocolsUsed: simulation.quote.protocols.flat().map(p => p.name),
        oneInchQuoteData: simulation.quote,
        type: 'swap'
      });
      
      res.json({
        success: true,
        data: {
          transaction,
          oneInchData: simulation
        },
        message: 'Virtual swap executed successfully'
      });
    } catch (error) {
      console.error('Error executing virtual swap:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute virtual swap',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getFusionQuote = async (req: Request, res: Response) => {
    try {
      const {
        srcChainId,
        dstChainId,
        srcTokenAddress,
        dstTokenAddress,
        amount,
        walletAddress
      } = req.query;
      
      if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters for cross-chain quote'
        });
      }
      
      const quote = await this.oneInchService.getFusionQuote({
        srcChainId: parseInt(srcChainId as string),
        dstChainId: parseInt(dstChainId as string),
        srcTokenAddress: srcTokenAddress as string,
        dstTokenAddress: dstTokenAddress as string,
        amount: amount as string,
        walletAddress: walletAddress as string
      });
      
      res.json({
        success: true,
        data: quote
      });
    } catch (error) {
      console.error('Error fetching fusion quote:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cross-chain quote',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getFusionChains = async (req: Request, res: Response) => {
    try {
      const chains = await this.oneInchService.getFusionSupportedChains();
      
      res.json({
        success: true,
        data: { supportedChains: chains }
      });
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supported chains',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getLimitOrders = async (req: Request, res: Response) => {
    try {
      const { chainId = '1' } = req.params;
      const { maker, makerAsset, takerAsset } = req.query;
      
      const orders = await this.oneInchService.getLimitOrders(
        parseInt(chainId),
        maker as string,
        makerAsset as string,
        takerAsset as string
      );
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching limit orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch limit orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  healthCheck = async (req: Request, res: Response) => {
    try {
      const isHealthy = await this.oneInchService.healthCheck();
      
      res.json({
        success: true,
        data: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getTokenPrices = async (req: Request, res: Response) => {
    try {
      const { chainId = '1' } = req.params;
      const { addresses } = req.query;
      
      if (!addresses) {
        return res.status(400).json({
          success: false,
          message: 'Missing token addresses parameter'
        });
      }
      
      const tokenAddresses = (addresses as string).split(',');
      const prices = await this.oneInchService.getTokenPrices(
        parseInt(chainId),
        tokenAddresses
      );
      
      res.json({
        success: true,
        data: prices
      });
    } catch (error) {
      console.error('Error fetching token prices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch token prices',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

}