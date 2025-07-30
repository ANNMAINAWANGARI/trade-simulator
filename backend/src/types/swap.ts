export interface SwapQuoteRequest {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string; // In wei/smallest unit
  chainId: number;
  slippage?: number; // 1-50, default 1
}

export interface CrossChainSwapRequest {
  fromTokenAddress: string;
  fromChainId: number;
  toTokenAddress: string;
  toChainId: number;
  amount: string;
  slippage?: number;
}

export interface SwapQuoteResponse {
  fromToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  };
  toToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  };
  fromAmount: string;
  toAmount: string;
  estimatedGas?: string;
  protocols?: any[];
  priceImpact?: string;
  type: 'classic' | 'fusion' | 'cross-chain';
}

export interface SwapSimulationRequest {
  userId: string;
  swap: SwapQuoteRequest | CrossChainSwapRequest;
  execute?: boolean; // If true, actually update wallet balances
}

export interface SwapSimulationResponse {
  success: boolean;
  message: string;
  data?: {
    quote: SwapQuoteResponse;
    balanceChanges: {
      before: { [chainId: string]: any };
      after: { [chainId: string]: any };
    };
    transactionPreview?: {
      fromAmount: string;
      toAmount: string;
      priceImpact: string;
      minimumReceived: string;
      networkFee: string;
    };
  };
}
