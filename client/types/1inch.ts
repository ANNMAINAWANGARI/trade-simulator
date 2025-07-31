import { VirtualTransaction } from "./wallet";

export interface OneInchApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface OneInchTokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoURI: string;
  tags: string[];
}

export interface SwapSimulationRequest {
  walletId: string;
  chainId?: number;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
}

export interface VirtualSwapRequest extends SwapSimulationRequest {
  fromTokenSymbol?: string;
  toTokenSymbol?: string;
}

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
    gasPrice: GasPriceResponse;
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

export interface SwapSimulationResponse {
  quote: OneInchQuoteResponse;
  swap: OneInchSwapResponse;
  gasPrice: GasPriceResponse;
  walletId: string;
  canExecute: boolean;
}

export interface VirtualSwapResponse {
  transaction: VirtualTransaction;
  oneInchData: SwapSimulationResponse;
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

export interface OneInchQuoteResponse {
  fromToken: OneInchTokenInfo;
  toToken: OneInchTokenInfo;
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

