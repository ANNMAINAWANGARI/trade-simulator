import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Pool } from 'pg';
import { TokenPrices } from '../types/oneInch';
import { ClassicTokenSwapDetails, CrossChainSwapRequest, normalizeQuote, Quote, SwapQuoteRequest, SwapQuoteResponse, SwapSimulationRequest, SwapSimulationResponse } from '../types/swap';
import { WalletService } from './walletService';
import { walletUtils } from '../types/wallet';
import { toNumber } from 'ethers';

export interface GasPriceResponse {
    baseFee: string,
    low:{
        maxPriorityFeePerGas: string,
        maxFeePerGas:string
    },
    medium:{
        maxPriorityFeePerGas:string,
        maxFeePerGas:string
    },
    high:{
        maxPriorityFeePerGas:string,
        maxFeePerGas:string
    },
    instant:{
        maxPriorityFeePerGas:string,
        maxFeePerGas:string
    }
}


export interface OneInchTokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoURI: string;
  tags: string[];
}

export interface OneInchTokensResponse {
  tokens: Record<string, OneInchTokenInfo>;
}

export interface OneInchBalanceResponse {
  [tokenAddress: string]: string;
}


export class OneInchService {
  private apiClient: AxiosInstance;
  private baseURL: string;
  private db: Pool;
  private walletService: WalletService;

  constructor(db: Pool) {
    this.db = db;
    this.baseURL = process.env.PROXY_URL!;
    this.walletService = new WalletService(db);
    
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    // request/response interceptors for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(`1inch API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`1inch API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`1inch API Error: ${error.response?.status} - ${error.config?.url}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // ==================== WALLET-RELATED APIs ====================


   // List of tokens that are available for swap in the 1inch Aggregation protocol
  async getTokens(chainId: number = 1): Promise<OneInchTokensResponse> {
    try {
      const response: AxiosResponse<OneInchTokensResponse> = await this.apiClient.get(
        `/swap/v6.1/${chainId}/tokens`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw new Error('Failed to fetch supported tokens');
    }
  }

  // Get spot price for a token
  async getSpotPrice(chainId: number, tokenAddress: string, currency?: string): Promise<TokenPrices> {
    try {
      const params: any = {
        currency:'USD'
      };
      if (currency) params.currency = currency;

      const response = await this.apiClient.get(
        `/price/v1.1/${chainId}/${tokenAddress}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching spot price:', error);
      throw new Error('Failed to fetch spot price');
    }
  }

  // ==================== TRADING APIs ====================


  // Get classic swap quote (same chain)
  public async getClassicSwapQuote(params: SwapQuoteRequest): Promise<ClassicTokenSwapDetails | null> {
    try {
      const response = await this.apiClient.get(`/swap/v6.1/${params.fromChainId}/quote`, {
        params: {
          src: params.fromTokenAddress,
          dst: params.toTokenAddress,
          amount: params.amount,
          includeTokensInfo: true,
          includeProtocols: true,
          includeGas: true
        }
      });

      const data = response.data;

      return {
        srcToken: {
          address: data.srcToken.address,
          symbol: data.srcToken.symbol,
          name: data.srcToken.name,
          decimals: data.srcToken.decimals,
          logoURI: data.srcToken.logoURI
        },
        dstToken: {
          address: data.dstToken.address,
          symbol: data.dstToken.symbol,
          name: data.dstToken.name,
          decimals: data.dstToken.decimals,
          logoURI: data.dstToken.logoURI
        },
        fromAmount: params.amount,
        dstAmount: data.dstAmount,
        gas: data.gas,
        
        type: 'classic'
      };

    } catch (error) {
      console.error('Error getting classic swap quote:', error);
      return null;
    }
  }

  // Get Fusion swap quote (cross-chain)
  public async getCrossChainSwapQuote(params: CrossChainSwapRequest): Promise<SwapQuoteResponse | null> {
    try {
      // Use Fusion+ API for cross-chain quotes
      const response = await this.apiClient.get('fusion-plus/quoter/v1.0/quote/receive', {
        params: {
          srcChain: params.fromChainId.toString(),        
          dstChain: params.toChainId.toString(),
          srcTokenAddress: params.fromTokenAddress,
          dstTokenAddress: params.toTokenAddress,
          amount: params.amount,
          walletAddress:'0x0000000000000000000000000000000000000000',
          enableEstimate: true
        }
      });

      const data = response.data;

      return {
        fromToken: {
          address: params.fromTokenAddress,
          srcTokenAmount:data.srcTokenAmount,
        },
        toToken: {
          address: params.toTokenAddress,
          dstTokenAmount:data.dstTokenAmount,
        },
        presetsRes:{
          presets:{
            fast:{
              auctionDuration:data.auctionDuration,
              startAuctionIn:data.auctionDuration,
              initialRateBump:data.initialRateBump,
              auctionEndAmount:data.auctionEndAmount,
              startAmount:data.startAmount,
              auctionStartAmount:data.auctionStartAmount,
              costInDstToken:data.costInDstToken,
              delay:data.delay,
              coefficient:data.coefficient,
              allowPartialFills:data.allowPartialFills,
              allowMultipleFills:data.allowMultipleFills,
              gasBumpEstimate:data.gasBumpEstimate,
              gasPriceEstimate:data.gasPriceEstimate,
              secretsCount:data.secretsCount,
              gasCost:{
                gasBumpEstimate:data.gasBumpEstimate,
                gasPriceEstimate:data.gasPriceEstimate
              }
            },
            medium:{
              auctionDuration:data.auctionDuration,
              startAuctionIn:data.auctionDuration,
              initialRateBump:data.initialRateBump,
              auctionEndAmount:data.auctionEndAmount,
              startAmount:data.startAmount,
              auctionStartAmount:data.auctionStartAmount,
              costInDstToken:data.costInDstToken,
              delay:data.delay,
              coefficient:data.coefficient,
              allowPartialFills:data.allowPartialFills,
              allowMultipleFills:data.allowMultipleFills,
              gasBumpEstimate:data.gasBumpEstimate,
              gasPriceEstimate:data.gasPriceEstimate,
              secretsCount:data.secretsCount,
              gasCost:{
                gasBumpEstimate:data.gasBumpEstimate,
                gasPriceEstimate:data.gasPriceEstimate
              }
            },
            slow:{
              auctionDuration:data.auctionDuration,
              startAuctionIn:data.auctionDuration,
              initialRateBump:data.initialRateBump,
              auctionEndAmount:data.auctionEndAmount,
              startAmount:data.startAmount,
              auctionStartAmount:data.auctionStartAmount,
              costInDstToken:data.costInDstToken,
              delay:data.delay,
              coefficient:data.coefficient,
              allowPartialFills:data.allowPartialFills,
              allowMultipleFills:data.allowMultipleFills,
              gasBumpEstimate:data.gasBumpEstimate,
              gasPriceEstimate:data.gasPriceEstimate,
              secretsCount:data.secretsCount,
              gasCost:{
                gasBumpEstimate:data.gasBumpEstimate,
                gasPriceEstimate:data.gasPriceEstimate
              }
            },
            custom:{
              auctionDuration:data.auctionDuration,
              startAuctionIn:data.auctionDuration,
              initialRateBump:data.initialRateBump,
              auctionEndAmount:data.auctionEndAmount,
              startAmount:data.startAmount,
              auctionStartAmount:data.auctionStartAmount,
              costInDstToken:data.costInDstToken,
              delay:data.delay,
              coefficient:data.coefficient,
              allowPartialFills:data.allowPartialFills,
              allowMultipleFills:data.allowMultipleFills,
              gasBumpEstimate:data.gasBumpEstimate,
              gasPriceEstimate:data.gasPriceEstimate,
              secretsCount:data.secretsCount,
              gasCost:{
                gasBumpEstimate:data.gasBumpEstimate,
                gasPriceEstimate:data.gasPriceEstimate
              }
            },
            
            
          },
          recommendedPreset:data.recommendedPreset,
          srcSafetyDeposit:data.srcSafetyDeposit,
          dstSafetyDeposit:data.dstSafetyDeposit,
          prices:{
            amountSrcToken:data.prices.usd.srcToken,
            amountDstToken:data.prices.usd.dstToken,

          },
          priceImpactPercent:data.priceImpactPercent
        },
        
        type: 'cross-chain'
      };

    } catch (error) {
      console.error('Error getting cross-chain swap quote:', error);
      return null;
    }
  }

  public async simulateSwap(request: SwapSimulationRequest): Promise<SwapSimulationResponse> {
  try {
    // Get user's current wallet
    const walletResponse = await this.walletService.getWalletByUserId(request.userId);
    if (!walletResponse.success || !walletResponse.data) {
      return {
        success: false,
        message: 'User wallet not found'
      };
    }

    const wallet = walletResponse.data.wallet;
    const beforeBalances = JSON.parse(JSON.stringify(wallet.chains)); // Deep clone

    // Determine swap type and get quote
    let quote: ClassicTokenSwapDetails | SwapQuoteResponse | null = null;
    //const isCrossChain = 'fromChainId' in request.swap !== 'toChainId' in request.swap;
    const isCrossChain =  request.swap.fromChainId != request.swap.toChainId

    if (isCrossChain) {
      console.log('Cross-chain swap detected');
      quote = await this.getCrossChainSwapQuote(request.swap as CrossChainSwapRequest) as SwapQuoteResponse;
      console.log('Cross-chain quote:', quote);
    } else {
      console.log('Classic swap detected');
      quote = await this.getClassicSwapQuote(request.swap as SwapQuoteRequest) as ClassicTokenSwapDetails;
      console.log('Classic quote:', quote);
    }

    if (!quote) {
      return {
        success: false,
        message: 'Failed to get swap quote'
      };
    }

    // Extract token addresses and amounts based on quote type
    let fromTokenAddress: string;
    let toTokenAddress: string;
    let fromAmount: string;
    let toAmount: string;
    let fromTokenDecimals: number;
    let toTokenDecimals: number;
    let priceImpact: string;
    let toTokenName:string = '';
    let toTokenSymbol:string = '';
    let toTokenURI:string ='';
    //const classicQuote = quote as ClassicTokenSwapDetails;

    if (isCrossChain && 'fromToken' in quote) {
      // SwapQuoteResponse (cross-chain)
      const crossChainQuote = quote as SwapQuoteResponse;
      fromTokenAddress = crossChainQuote.fromToken.address;
      toTokenAddress = crossChainQuote.toToken.address;
      fromAmount = crossChainQuote.fromToken.srcTokenAmount;
      toAmount = crossChainQuote.toToken.dstTokenAmount;
      priceImpact = crossChainQuote.presetsRes.priceImpactPercent.toString();

      // Get token decimals from 1inch API
      try {
        const fromTokenInfo = await this.apiClient.get(`/token/v1.4/${request.swap.fromChainId}/custom/${fromTokenAddress}`);
        const toTokenInfo = await this.apiClient.get(`/token/v1.4/${request.swap.toChainId}/custom/${toTokenAddress}`);
        fromTokenDecimals = fromTokenInfo.data.decimals;
        toTokenDecimals =  toTokenInfo.data.decimals;
        toTokenName = toTokenInfo.data.name;
        toTokenSymbol = toTokenInfo.data.symbol;
        toTokenURI = toTokenInfo.data.logoURI;
      } catch (error) {
        console.error('Error fetching token decimals:', error);
        // Fallback decimals
        fromTokenDecimals = 18;
        toTokenDecimals = 18;
      }
    } else {
      // ClassicTokenSwapDetails (same chain)
      const classicQuote = quote as ClassicTokenSwapDetails;
      fromTokenAddress = classicQuote.srcToken.address;
      toTokenAddress = classicQuote.dstToken.address;
      fromAmount = classicQuote.fromAmount;
      toAmount = classicQuote.dstAmount;
      fromTokenDecimals = classicQuote.srcToken.decimals;
      toTokenDecimals = classicQuote.dstToken.decimals;
      priceImpact = '< 0.01%'; // Default for classic swaps
    }

    // Validate user has sufficient balance
    const fromChainId = isCrossChain ? 
      (request.swap as CrossChainSwapRequest).fromChainId : 
      (request.swap as SwapQuoteRequest).fromChainId;

    const fromToken = walletUtils.getTokenInChain(wallet, fromChainId, fromTokenAddress);
    
    if (!fromToken) {
      return {
        success: false,
        message: 'Source token not found in wallet'
      };
    }

    const availableBalance = BigInt(fromToken.balance);
    const requiredBalance = BigInt(fromAmount);

    if (availableBalance < requiredBalance) {
      return {
        success: false,
        message: `Insufficient balance. Required: ${walletUtils.fromWei(fromAmount, fromTokenDecimals)} ${fromToken.token_symbol}, Available: ${fromToken.formatted_balance} ${fromToken.token_symbol}`
      };
    }

    // Calculate balance changes
    let afterBalances = JSON.parse(JSON.stringify(beforeBalances));
    request.execute = true;

    if (request.execute) {
      console.log('Executing swap...');
      // Execute the swap simulation by updating balances
      if (isCrossChain) {
        const crossChainSwap = request.swap as CrossChainSwapRequest;
        await this.walletService.simulateSwap(
          request.userId,
          crossChainSwap.fromChainId,
          fromTokenAddress,
          fromAmount,
          crossChainSwap.toChainId,
          toTokenAddress,
          toAmount,
          toTokenDecimals,
          toTokenName,
          toTokenSymbol,
          toTokenURI
        );
      } else {
        const sameChainSwap = request.swap as SwapQuoteRequest;
        const classicQuote = quote as ClassicTokenSwapDetails;
        await this.walletService.simulateSwap(
          request.userId,
          sameChainSwap.fromChainId,
          fromTokenAddress,
          fromAmount,
          sameChainSwap.fromChainId,
          toTokenAddress,
          toAmount,
          //toTokenDecimals,
          classicQuote.dstToken.decimals,
          classicQuote.dstToken.name,
          classicQuote.dstToken.symbol,
          classicQuote.dstToken.logoURI
          //toTokenName,
          //toTokenSymbol
        );
      }

      // Get updated balances
      const updatedWalletResponse = await this.walletService.getWalletByUserId(request.userId);
      if (updatedWalletResponse.success && updatedWalletResponse.data) {
        afterBalances = updatedWalletResponse.data.wallet.chains;
      }
    } else {
      // Just simulate the changes without persisting
      if (isCrossChain) {
        const crossChainSwap = request.swap as CrossChainSwapRequest;
        afterBalances = this.simulateBalanceChanges(
          afterBalances,
          crossChainSwap.fromChainId,
          fromTokenAddress,
          fromAmount,
          crossChainSwap.toChainId,
          toTokenAddress,
          toAmount
        );
      } else {
        const sameChainSwap = request.swap as SwapQuoteRequest;
        afterBalances = this.simulateBalanceChanges(
          afterBalances,
          sameChainSwap.fromChainId,
          fromTokenAddress,
          fromAmount,
          sameChainSwap.fromChainId,
          toTokenAddress,
          toAmount
        );
      }
    }

    // Calculate slippage and minimum received
    const slippage = isCrossChain ? 
      (request.swap as CrossChainSwapRequest).slippage || 1 :
      (request.swap as SwapQuoteRequest).slippage || 1;
    
    const minimumReceived = (BigInt(toAmount) * BigInt(100 - slippage) / BigInt(100)).toString();

    return {
      success: true,
      message: request.execute ? 'Swap executed successfully' : 'Swap simulated successfully',
      data: {
        quote,
        balanceChanges: {
          before: beforeBalances,
          after: afterBalances
        },
        transactionPreview: {
          fromAmount: walletUtils.fromWei(fromAmount, fromTokenDecimals),
          toAmount: walletUtils.fromWei(toAmount, toTokenDecimals),
          priceImpact: priceImpact,
          minimumReceived: walletUtils.fromWei(minimumReceived, toTokenDecimals),
          networkFee: quote.type === 'fusion' || quote.type === 'cross-chain' ? '0' : '~$5-15'
        }
      }
    };

  } catch (error) {
    console.error('Swap simulation error:', error);
    return {
      success: false,
      message: 'Swap simulation failed'
    };
  }
  }
 
  


  // ==================== CROSS-CHAIN (Fusion+) APIs ====================


  // Get all supported chains
  async getFusionSupportedChains(): Promise<number[]> {
    try {
      const response = await this.apiClient.get('token/v1.3/multi-chain/supported-chains');
      return response.data;
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      return [1, 137, 56, 42161, 10]; // Default supported chains
    }
  }


  // ==================== UTILITY APIs ====================

  // Get Gas Price info from network 
  async getGasPrice(chainId: number = 1): Promise<GasPriceResponse> {
    try {
      const response = await this.apiClient.get(`/gas-price/v1.6/${chainId}`); 
      return response.data;
    } catch (error) {
      console.error('Error fetching gas price:', error);
      throw new Error('Failed to fetch gas price info for this chain');
     
    }
  }

   // Check API health
  async healthCheck(chainId: number = 1): Promise<boolean> {
    try {
      const response = await this.apiClient.get(`/healthcheck`);
      return response.status === 200;
    } catch (error) {
      console.error('1inch API health check failed:', error);
      return false;
    }
  }


   // ==================== SIMULATION HELPERS ====================

   // Helper to simulate balance changes without persisting
  private simulateBalanceChanges(
    chains: any,
    fromChainId: number,
    fromTokenAddress: string,
    fromAmount: string,
    toChainId: number,
    toTokenAddress: string,
    toAmount: string
  ): any {
    const updatedChains = JSON.parse(JSON.stringify(chains));

    // Deduct from source
    const fromChain = updatedChains[fromChainId.toString()];
    if (fromChain) {
      const fromTokenIndex = fromChain.tokens.findIndex((t: any) => 
        t.token_address.toLowerCase() === fromTokenAddress.toLowerCase()
      );
      
      if (fromTokenIndex !== -1) {
        const currentBalance = BigInt(fromChain.tokens[fromTokenIndex].balance);
        const newBalance = (currentBalance - BigInt(fromAmount)).toString();
        fromChain.tokens[fromTokenIndex].balance = newBalance;
        fromChain.tokens[fromTokenIndex].formatted_balance = walletUtils.fromWei(
          newBalance, 
          fromChain.tokens[fromTokenIndex].decimals
        );
      }
    }

    // Add to destination
    const toChain = updatedChains[toChainId.toString()];
    if (toChain) {
      const toTokenIndex = toChain.tokens.findIndex((t: any) => 
        t.token_address.toLowerCase() === toTokenAddress.toLowerCase()
      );
      
      if (toTokenIndex !== -1) {
        const currentBalance = BigInt(toChain.tokens[toTokenIndex].balance);
        const newBalance = (currentBalance + BigInt(toAmount)).toString();
        toChain.tokens[toTokenIndex].balance = newBalance;
        toChain.tokens[toTokenIndex].formatted_balance = walletUtils.fromWei(
          newBalance, 
          toChain.tokens[toTokenIndex].decimals
        );
      } else {
        // Token doesn't exist, we would need to add it
        // For simulation, we'll skip this case
      }
    }

    return updatedChains;
  }


  // Get popular swap pairs for a chain
  public async getPopularSwapPairs(chainId: number): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/swap/v6.1/${chainId}/tokens`);
      const tokens = response.data.tokens;
      
      // Return some popular pairs (this could be enhanced with real data)
      const popularTokens = Object.values(tokens).slice(0, 10);
      return popularTokens as any[];
      
    } catch (error) {
      console.error('Error getting popular swap pairs:', error);
      return [];
    }
  }

   // Get real-time token prices for portfolio valuation
  async getTokenPrices(chainId: number, tokenAddresses: string[]): Promise<Record<string, string>> {
    try {
      const prices: Record<string, string> = {};
      
      // Get prices for each token (in parallel)
      const pricePromises = tokenAddresses.map(async (address) => {
        try {
          const priceObj = await this.getSpotPrice(chainId, address);
          const price = priceObj[address] ?? '0';
          return { address, price };
        } catch (error) {
          console.error(`Failed to get price for ${address}:`, error);
          return { address, price: '0' };
        }
      });

      const results = await Promise.all(pricePromises);
      
      results.forEach(({ address, price }) => {
        prices[address] = price;
      });

      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      throw error;
    }
  }

   // Cache frequently used data
  private tokenCache: Map<string, OneInchTokensResponse> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  async getTokensCached(chainId: number): Promise<OneInchTokensResponse> {
    const cacheKey = `tokens_${chainId}`;
    const now = Date.now();
    
    // Check if cache is valid (5 minutes)
    if (this.tokenCache.has(cacheKey) && 
        this.cacheExpiry.has(cacheKey) && 
        this.cacheExpiry.get(cacheKey)! > now) {
      return this.tokenCache.get(cacheKey)!;
    }

    // Fetch fresh data
    const tokens = await this.getTokens(chainId);
    
    // Cache it
    this.tokenCache.set(cacheKey, tokens);
    this.cacheExpiry.set(cacheKey, now + 5 * 60 * 1000); // 5 minutes
    
    return tokens;
  }

  async getMarketData(chainId: number): Promise<{
    tokens: OneInchTokensResponse;
    gasPrice: GasPriceResponse
    supportedChains: number[];
    walletBalances?: OneInchBalanceResponse;
  }> {
    try {
      const [tokens, gasPrice, supportedChains] = await Promise.all([
        this.getTokensCached(chainId),
        this.getGasPrice(chainId),
        this.getFusionSupportedChains(),
       
      ]);

      return {
        tokens,
        gasPrice,
        supportedChains
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }
}

