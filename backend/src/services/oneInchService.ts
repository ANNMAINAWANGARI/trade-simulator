import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Pool } from 'pg';


export interface OneInchQuoteParams {
  src: string;           // Source token address
  dst: string;           // Destination token address  
  amount: string;        // Amount in wei
  fee?: string;          // Fee percentage (0-3%)
  gasPrice?: string;     // Gas price in wei
  protocols?: string;    // Comma-separated list of protocols
  connectorTokens?: string; // Connector tokens
  complexityLevel?: string; // 0, 1, 2, or 3
  mainRouteParts?: string;  // Number of main route parts
  parts?: string;        // Number of parts
  gasLimit?: string;     // Gas limit for transaction
}

export interface OneInchQuoteResponse {
  fromToken: {
    symbol: string;
    name: string;
    decimals: number;
    address: string;
    logoURI: string;
  };
  toToken: {
    symbol: string;
    name: string;
    decimals: number;
    address: string;
    logoURI: string;
  };
  toAmount: string;
  fromAmount: string;
  protocols: Array<Array<{
    name: string;
    part: number;
    fromTokenAddress: string;
    toTokenAddress: string;
  }>>;
  estimatedGas: number;
  gasPrice: GasPriceResponse;

}

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

export interface OneInchSwapParams extends OneInchQuoteParams {
  from: string;          // Wallet address
  slippage: number;      // Slippage percentage (0.1-50)
  referrer?: string;     // Referrer address
  allowPartialFill?: boolean;
}

export interface OneInchSwapResponse extends OneInchQuoteResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: number;
  };
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

export interface OneInchSpotPriceParams {
  tokenAddress: string;
  currency?: string; // Default is native token
}

export interface OneInchBalanceParams {
  walletAddress: string;
  tokenAddresses?: string; // Comma-separated list
}

export interface OneInchBalanceResponse {
  [tokenAddress: string]: string;
}

// Fusion+ (Cross-chain) Types
export interface FusionQuoteParams {
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
}

export interface FusionQuoteResponse {
  srcChainId: number;
  dstChainId: number;
  dstTokenAmount: string;
  recommendedGasLimit: string;
  prices: {
    recommended: {
      feeToken: string;
      feeAmount: string;
    };
  };
  volume: {
    srcUSD: string;
    dstUSD: string;
  };
  timeLocks: {
    srcWithdrawal: number;
    srcPublicWithdrawal: number;
    srcCancellation: number;
    dstWithdrawal: number;
    dstPublicWithdrawal: number;
  };
}

// Limit Orders Types
export interface LimitOrderParams {
  makerAsset: string;
  takerAsset: string;
  makerAmount: string;
  takerAmount: string;
  maker: string;
  expiration?: number;
  salt?: string;
}

export class OneInchService {
  private apiClient: AxiosInstance;
  private baseURL: string;
  //private apiKey: string;
  private db: Pool;

  constructor(db: Pool, apiKey?: string) {
    this.db = db;
    //this.apiKey = apiKey || process.env.ONEINCH_API_KEY || '';
    this.baseURL = process.env.PROXY_URL!;
    
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

  // Get balances of tokens for walletAddress
  async getWalletBalances(chainId: number, walletAddress: string, tokenAddresses?: string[]): Promise<OneInchBalanceResponse> {
    try {
      const params: any = {};
      if (tokenAddresses && tokenAddresses.length > 0) {
        params.tokenAddresses = tokenAddresses.join(',');
      }

      const response: AxiosResponse<OneInchBalanceResponse> = await this.apiClient.get(
        `/balance/v1.2/${chainId}/balances/${walletAddress}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      throw new Error('Failed to fetch wallet balances');
    }
  }

  // Get spot price for a token
  async getSpotPrice(chainId: number, tokenAddress: string, currency?: string): Promise<string> {
    try {
      const params: any = {};
      if (currency) params.currency = currency;

      const response = await this.apiClient.get(
        `/price/v1.1/${chainId}/${tokenAddress}`, 
        { params }
      );
      return response.data[tokenAddress] || '0';
    } catch (error) {
      console.error('Error fetching spot price:', error);
      throw new Error('Failed to fetch spot price');
    }
  }

  // ==================== TRADING APIs ====================

  // Get quote for a swap
  async getQuote(chainId: number, params: OneInchQuoteParams): Promise<OneInchQuoteResponse> {
    try {
      const response: AxiosResponse<OneInchQuoteResponse> = await this.apiClient.get(
        `/swap/v6.1/${chainId}/quote`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw new Error('Failed to fetch swap quote');
    }
  }

  // Get swap transaction data (for simulation)
  async getSwap(chainId: number, params: OneInchSwapParams): Promise<OneInchSwapResponse> {
    try {
      const response: AxiosResponse<OneInchSwapResponse> = await this.apiClient.get(
        `/swap/v6.1/${chainId}/swap`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching swap data:', error);
      throw new Error('Failed to fetch swap transaction data');
    }
  }

  // ==================== CROSS-CHAIN (Fusion+) APIs ====================

  // Get cross-chain quote
  async getFusionQuote(params: FusionQuoteParams): Promise<FusionQuoteResponse> {
    try {
      const response: AxiosResponse<FusionQuoteResponse> = await this.apiClient.get(
        '/fusion-plus/quoter/v1.0/quote/receive', 
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching fusion quote:', error);
      throw new Error('Failed to fetch cross-chain quote');
    }
  }

  // Get supported chains for Fusion+
  async getFusionSupportedChains(): Promise<number[]> {
    try {
      const response = await this.apiClient.get('/fusion/quoter/v1.0/chains');
      return response.data;
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      return [1, 137, 56, 42161, 10]; // Default supported chains
    }
  }

// ==================== LIMIT ORDERS APIs ====================

  // Get all limit orders
  async getLimitOrders(chainId: number, maker?: string, makerAsset?: string, takerAsset?: string): Promise<any[]> {
    try {
      const params: any = {};
      if (maker) params.maker = maker;
      if (makerAsset) params.makerAsset = makerAsset;
      if (takerAsset) params.takerAsset = takerAsset;

      const response = await this.apiClient.get(
        `/orderbook/v4.0/${chainId}/all`, 
        { params }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching limit orders:', error);
      return [];
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

   // Simulate a trade with real 1inch data
  async simulateSwap(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    walletAddress: string,
    slippage: number = 1
  ): Promise<{
    quote: OneInchQuoteResponse;
    swap: OneInchSwapResponse;
    gasPrice: GasPriceResponse;
  }> {
    try {
      // Get quote first
      const quote = await this.getQuote(chainId, {
        src: fromToken,
        dst: toToken,
        amount: amount
      });

      // Get swap data
      const swap = await this.getSwap(chainId, {
        src: fromToken,
        dst: toToken,
        amount: amount,
        from: walletAddress,
        slippage: slippage
      });

      // Get current gas price
      const gasPrice = await this.getGasPrice(chainId);

      return {
        quote,
        swap,
        gasPrice,
      };
    } catch (error) {
      console.error('Error simulating swap:', error);
      throw error;
    }
  }

   // Get real-time token prices for portfolio valuation
  async getTokenPrices(chainId: number, tokenAddresses: string[]): Promise<Record<string, string>> {
    try {
      const prices: Record<string, string> = {};
      
      // Get prices for each token (in parallel)
      const pricePromises = tokenAddresses.map(async (address) => {
        try {
          const price = await this.getSpotPrice(chainId, address);
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

  async getMarketData(chainId: number, walletAddress?: string): Promise<{
    tokens: OneInchTokensResponse;
    gasPrice: GasPriceResponse
    supportedChains: number[];
    walletBalances?: OneInchBalanceResponse;
  }> {
    try {
      const [tokens, gasPrice, supportedChains, walletBalances] = await Promise.all([
        this.getTokensCached(chainId),
        this.getGasPrice(chainId),
        this.getFusionSupportedChains(),
        walletAddress ? this.getWalletBalances(chainId, walletAddress) : Promise.resolve(undefined)
      ]);

      return {
        tokens,
        gasPrice,
        supportedChains,
        walletBalances
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }
}

