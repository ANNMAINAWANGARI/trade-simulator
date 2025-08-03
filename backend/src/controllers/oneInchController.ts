import { Request, Response } from 'express';
import { OneInchService } from '../services/oneInchService';
import { WalletService } from '../services/walletService';
import { Pool } from 'pg';
import { CrossChainSwapRequest, SwapQuoteRequest } from '../types/swap';
import { AuthenticatedRequest } from '../middleware/auth';


export class OneInchController {
  private oneInchService: OneInchService;
  private walletService: WalletService;

  constructor(db: Pool) {
    this.oneInchService = new OneInchService(db);
    this.walletService = new WalletService(db);
  }

  // Get quote for classic swap (same chain)
  public getSwapQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromToken, toToken, amount, chainId, slippage } = req.query;

      if (!fromToken || !toToken || !amount || !chainId) {
        res.status(400).json({
          success: false,
          message: 'fromToken, toToken, amount, and chainId are required'
        });
        return;
      }

      const quoteRequest: SwapQuoteRequest = {
        fromTokenAddress: fromToken as string,
        toTokenAddress: toToken as string,
        amount: amount as string,
        fromChainId: parseInt(chainId as string),
        toChainId: parseInt(chainId as string),
        slippage: slippage ? parseInt(slippage as string) : 1
      };

      const quote = await this.oneInchService.getClassicSwapQuote(quoteRequest);

      if (quote) {
        res.status(200).json({
          success: true,
          message: 'Swap quote retrieved successfully',
          data: quote
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to get swap quote'
        });
      }

    } catch (error) {
      console.error('Get swap quote error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get quote for cross-chain swap
  public getCrossChainQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromToken, fromChainId, toToken, toChainId, amount, slippage } = req.query;

      if (!fromToken || !fromChainId || !toToken || !toChainId || !amount) {
        res.status(400).json({
          success: false,
          message: 'fromToken, fromChainId, toToken, toChainId, and amount are required'
        });
        return;
      }

      const quoteRequest: CrossChainSwapRequest = {
        fromTokenAddress: fromToken as string,
        fromChainId: parseInt(fromChainId as string),
        toTokenAddress: toToken as string,
        toChainId: parseInt(toChainId as string),
        amount: amount as string,
        slippage: slippage ? parseInt(slippage as string) : 1
      };

      const quote = await this.oneInchService.getCrossChainSwapQuote(quoteRequest);

      if (quote) {
        res.status(200).json({
          success: true,
          message: 'Cross-chain swap quote retrieved successfully',
          data: quote
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to get cross-chain swap quote'
        });
      }

    } catch (error) {
      console.error('Get cross-chain quote error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Preview swap without executing
  public previewSwap = async (req: Request, res: Response): Promise<void> => {
    try {
      
      const userId = (req as AuthenticatedRequest).user.userId;
      const swapRequest = req.body;

      // Validate request
      if (!swapRequest || (!swapRequest.chainId && !swapRequest.fromChainId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid swap request format'
        });
        return;
      }

      const simulation = await this.oneInchService.simulateSwap({
        userId,
        swap: swapRequest,
        execute: false // Preview only
      });

      if (simulation.success) {
        res.status(200).json(simulation);
      } else {
        res.status(400).json(simulation);
      }

    } catch (error) {
      console.error('Preview swap error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

   // Execute swap simulation
  public executeSwap = async (req: Request, res: Response): Promise<void> => {
    try {
      
      const userId = (req as AuthenticatedRequest).user.userId;
      const swapRequest = req.body;

      // Validate request
      if (!swapRequest || (!swapRequest.chainId && !swapRequest.fromChainId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid swap request format'
        });
        return;
      }

      const simulation = await this.oneInchService.simulateSwap({
        userId,
        swap: swapRequest,
        execute: true // Actually execute the swap
      });

      if (simulation.success) {
        res.status(200).json(simulation);
      } else {
        res.status(400).json(simulation);
      }

    } catch (error) {
      console.error('Execute swap error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get popular trading pairs
  public getPopularPairs = async (req: Request, res: Response): Promise<void> => {
    try {
      const chainId = parseInt(req.params.chainId);

      if (!chainId || isNaN(chainId)) {
        res.status(400).json({
          success: false,
          message: 'Valid chainId is required'
        });
        return;
      }

      const pairs = await this.oneInchService.getPopularSwapPairs(chainId);

      res.status(200).json({
        success: true,
        message: 'Popular swap pairs retrieved successfully',
        data: pairs
      });

    } catch (error) {
      console.error('Get popular pairs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public calculateAmount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, decimals, operation } = req.query;

      if (!amount || !decimals || !operation) {
        res.status(400).json({
          success: false,
          message: 'amount, decimals, and operation (toWei|fromWei) are required'
        });
        return;
      }

      const decimalCount = parseInt(decimals as string);
      let result: string;

      if (operation === 'toWei') {
        // Convert human readable to wei
        const factor = BigInt(10) ** BigInt(decimalCount);
        const amountFloat = parseFloat(amount as string);
        result = BigInt(Math.floor(amountFloat * (10 ** decimalCount))).toString();
      } else if (operation === 'fromWei') {
        // Convert wei to human readable
        const factor = BigInt(10) ** BigInt(decimalCount);
        const amountBigInt = BigInt(amount as string);
        const wholePart = amountBigInt / factor;
        const fractionalPart = amountBigInt % factor;
        
        if (fractionalPart === BigInt(0)) {
          result = wholePart.toString();
        } else {
          const fractionalStr = fractionalPart.toString().padStart(decimalCount, '0');
          const trimmedFractional = fractionalStr.replace(/0+$/, '');
          result = trimmedFractional === '' ? wholePart.toString() : `${wholePart}.${trimmedFractional}`;
        }
      } else {
        res.status(400).json({
          success: false,
          message: 'operation must be either "toWei" or "fromWei"'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Amount calculated successfully',
        data: {
          input: amount,
          output: result,
          decimals: decimalCount,
          operation
        }
      });

    } catch (error) {
      console.error('Calculate amount error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public getSwapHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.userId;
      const { page = 1, limit = 10 } = req.query;

      // TODO: Implement swap history tracking
      res.status(200).json({
        success: true,
        message: 'Swap history feature coming soon',
        data: {
          swaps: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0
          }
        }
      });

    } catch (error) {
      console.error('Get swap history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  public getTokens = async (req: Request, res: Response) => {
    try {
      const { chainId } = req.params;
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

  public getSpotPrice = async (req: Request, res: Response) => {
    try {
      const { chainId, tokenAddress } = req.params;
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

  public getGasPrice = async (req: Request, res: Response) => {
    try {
      const { chainId } = req.params;
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



  public getMarketData = async (req: Request, res: Response) => {
    try {
      const { chainId } = req.params;

      const marketData = await this.oneInchService.getMarketData(
        parseInt(chainId),
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


  public healthCheck = async (req: Request, res: Response) => {
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

  public getTokenPrices = async (req: Request, res: Response) => {
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