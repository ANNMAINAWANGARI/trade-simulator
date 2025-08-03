export interface SwapQuoteRequest {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string; // In wei/smallest unit
  fromChainId: number;
  toChainId: number;
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

interface Preset {
  auctionDuration: number;
  startAuctionIn: number;
  initialRateBump: number;
  auctionStartAmount: string;
  startAmount: string;
  auctionEndAmount: string;
  costInDstToken: string;
 
  delay: number;
  coefficient: number;
  allowPartialFills: boolean;
  allowMultipleFills: boolean;
  gasCost: GasCostConfig;
  gasBumpEstimate: number;
  gasPriceEstimate: string;
  secretsCount: number;
}

interface QuotePresets {
  fast: Preset;
  medium: Preset;
  slow: Preset;
  custom: Preset;
}

interface AuctionPoint {
  delay:number,
  coefficient:number 
}

interface GasCostConfig {
  gasBumpEstimate: number,
  gasPriceEstimate: number
}

interface PairCurrency {
  amountSrcToken: string;
  amountDstToken: string;
}


type RecommendedPreset = 'fast' | 'medium' | 'slow' | 'custom';

interface FullPresetsResponse {
  presets: QuotePresets;
  srcSafetyDeposit: string;
  dstSafetyDeposit: string;
  recommendedPreset: RecommendedPreset;
  prices: PairCurrency;
  priceImpactPercent:number;
}


// cross-chain
export interface SwapQuoteResponse {
  fromToken: {
    address: string;
    srcTokenAmount:string;
   
  };
  toToken: {
    address: string;
    dstTokenAmount:string;
  };
  presetsRes:FullPresetsResponse;
  type: 'classic' | 'fusion' | 'cross-chain';
}


export interface SwapSimulationRequest {
  userId: string;
  swap: SwapQuoteRequest | CrossChainSwapRequest;
  execute?: boolean;
}
export interface SwapSimulationResponse {
  success: boolean;
  message: string;
  data?: {
    quote: ClassicTokenSwapDetails | SwapQuoteResponse;
    balanceChanges: {
      before: { [chainId: string]: any };
      after: { [chainId: string]: any };
    };
    transactionPreview: {
      fromAmount: string;
      toAmount: string;
      priceImpact: string;
      minimumReceived: string;
      networkFee: string;
    };
  };
}

export type Quote =
  | { type: 'classic'; data: ClassicTokenSwapDetails | null }
  | null
  | { type: 'cross-chain'; data: SwapQuoteResponse | null };



// export interface SwapSimulationResponse {
//   success: boolean;
//   message: string;
//   data?: {
//     quote: SwapQuoteResponse;
//     balanceChanges: {
//       before: { [chainId: string]: any };
//       after: { [chainId: string]: any };
//     };
//     transactionPreview?: {
//       fromAmount: string;
//       toAmount: string;
//       priceImpact: string;
//       minimumReceived: string;
//       networkFee: string;
//     };
//   };
// }

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  domainVersion?: string;
  eip2612?: boolean;
  isFoT?: boolean;
  tags?: string[];
}

export interface ClassicTokenSwapDetails {
  srcToken: TokenInfo;
  dstToken: TokenInfo;
  dstAmount: string;
  gas: number;
  fromAmount:string;
  type: 'classic'| 'fusion' | 'cross-chain'
}









// Normalized Quote Interface (common structure for both types)
interface NormalizedQuote {
  fromToken: {
    address: string;
    amount: string;
  };
  toToken: {
    address: string;
    amount: string;
  };
  type: 'classic' | 'fusion' | 'cross-chain';
  presetsRes?: FullPresetsResponse; // Optional (present in SwapQuoteResponse)
  gas?: number; // Optional (present in ClassicTokenSwapDetails)
}

// Type Guards (to check quote type)
function isSwapQuoteResponse(quote: any): quote is SwapQuoteResponse {
  return quote && 'fromToken' in quote && 'toToken' in quote && 'presetsRes' in quote;
}

export function isClassicTokenSwapDetails(quote: any): quote is ClassicTokenSwapDetails {
  return quote && 'srcToken' in quote && 'dstToken' in quote && 'dstAmount' in quote;
}

// Normalization Function (converts any quote to NormalizedQuote)
export function normalizeQuote(quote: SwapQuoteResponse | ClassicTokenSwapDetails): NormalizedQuote {
  if (isSwapQuoteResponse(quote)) {
    return {
      fromToken: {
        address: quote.fromToken.address,
        amount: quote.fromToken.srcTokenAmount,
      },
      toToken: {
        address: quote.toToken.address,
        amount: quote.toToken.dstTokenAmount,
      },
      type: quote.type,
      presetsRes: quote.presetsRes,
    };
  } else {
    return {
      fromToken: {
        address: quote.srcToken.address,
        amount: quote.fromAmount,
      },
      toToken: {
        address: quote.dstToken.address,
        amount: quote.dstAmount,
      },
      type: quote.type,
      gas: quote.gas,
    };
  }
}
