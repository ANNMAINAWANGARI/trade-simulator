import { api } from './api';

export interface SwapQuote {
  dstToken?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  srcToken?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  toToken?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  fromToken?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  fromAmount: string;
  dstAmount: string;
  gas:number;
  type: 'classic' | 'cross-chain';
}

export interface SwapPreview {
  success: boolean;
  message: string;
  data?: {
    quote: SwapQuote;
    transactionPreview: {
      fromAmount: string;
      toAmount: string;
      priceImpact: string;
      minimumReceived: string;
      networkFee: string;
    };
  };
}

class SwapApiClient {
  async getQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number
  ): Promise<{ success: boolean; data?: SwapQuote; message: string }> {
    const params = new URLSearchParams({
      fromToken,
      toToken,
      amount,
      chainId: chainId.toString(),
      slippage: '1'
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/swap/quote?${params}`);
    return response.json();
  }

  
  async getCrossChainQuote(
    fromToken: string,
    fromChainId: number,
    toToken: string,
    toChainId: number,
    amount: string
  ): Promise<{ success: boolean; data?: SwapQuote; message: string }> {
    const params = new URLSearchParams({
      fromToken,
      fromChainId: fromChainId.toString(),
      toToken,
      toChainId: toChainId.toString(),
      amount,
      slippage: '1'
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/swap/cross-chain-quote?${params}`);
    return response.json();
  }

  async previewSwap(swapData: any, token: string): Promise<SwapPreview> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/1inch/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(swapData)
    });

    return response.json();
  }

  async executeSwap(swapData: any, token: string): Promise<SwapPreview> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/1inch/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(swapData)
    });

    return response.json();
  }
}
export const swapApi = new SwapApiClient();