import { VirtualTransaction } from "../models/Transaction";
import { GasPriceResponse, OneInchQuoteResponse, OneInchSwapResponse } from "../services/oneInchService";

export interface OneInchApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// export interface SwapSimulationRequest {
//   walletId: string;
//   chainId?: number;
//   fromToken: string;
//   toToken: string;
//   amount: string;
//   slippage?: number;
// }

// export interface VirtualSwapRequest extends SwapSimulationRequest {
//   fromTokenSymbol?: string;
//   toTokenSymbol?: string;
// }

// export interface SwapSimulationResponse {
//   quote: OneInchQuoteResponse;
//   swap: OneInchSwapResponse;
//   gasPrice: GasPriceResponse;
//   walletId: string;
//   canExecute: boolean;
// }

// export interface VirtualSwapResponse {
//   transaction: VirtualTransaction;
//   oneInchData: SwapSimulationResponse;
// }
////////////////////////////////////////////////
export enum SupportedChainIds {
  ETHEREUM = 1,
  POLYGON = 137,
  BNB_CHAIN = 56,
  OPTIMISM = 10,
  ARBITRUM = 42161,
  GNOSIS = 100,
  AVALANCHE = 43114,
  BASE = 8453
}
export type TokenPrices = {
  [tokenAddress: string]: string;
};
// export type ChainId = 1 | 137 | 56| 42161 |43114|8453|324|100|10|59144|146|130;
export interface OneInchTokenBalance {
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_decimals: number;
  balance: string;
  balance_wei: string;
}