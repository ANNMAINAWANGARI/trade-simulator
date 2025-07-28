import { VirtualTransaction } from "../models/Transaction";
import { GasPriceResponse, OneInchQuoteResponse, OneInchSwapResponse } from "../services/oneInchService";

export interface OneInchApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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