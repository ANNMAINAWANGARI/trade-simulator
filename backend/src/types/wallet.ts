export interface TokenBalance {
  token_address: string;
  token_symbol: string;
  token_name: string;
  decimals: number;
  balance: string; // Raw balance (wei format)
  formatted_balance: string; 
  logo_uri?: string;
  current_price_usd?: string;
  usd_value?: string;
}


export interface ChainWallet {
  chain_id: number;
  chain_name: string;
  chain_symbol: string;
  tokens: TokenBalance[];
  total_usd_value: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  chains: { [chainId: string]: ChainWallet };
  created_at: Date;
  updated_at: Date;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data?: {
    wallet: Wallet;
    total_usd_value: string;
  };
}


export interface DefaultChainSetup {
  chain_id: number;
  chain_name: string;
  chain_symbol: string;
  tokens: {
    token_address: string;
    token_symbol: string;
    token_name: string;
    decimals: number;
    initial_balance: string; // In wei/smallest unit
    logo_uri?: string;
  }[];
}




// Default wallet configuration
export const DEFAULT_WALLET_SETUP: DefaultChainSetup[] = [
  {
    chain_id: 1,
    chain_name: 'Ethereum',
    chain_symbol: 'ETH',
    tokens: [
      {
        token_address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        token_symbol: 'ETH',
        token_name: 'Ethereum',
        decimals: 18,
        initial_balance: '10000000000000000000', // 10 ETH
        logo_uri: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
      },
      {
        token_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        token_symbol: 'USDC',
        token_name: 'USD Coin',
        decimals: 6,
        initial_balance: '10000000', // 10 USDC
        logo_uri: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png'
      }
    ]
  },
  {
    chain_id: 137,
    chain_name: 'Polygon',
    chain_symbol: 'POL',
    tokens: [
      {
        token_address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC on Polygon
        token_symbol: 'USDC',
        token_name: 'USD Coin',
        decimals: 6,
        initial_balance: '10000000', // 10 USDC
        logo_uri: 'https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png'
      }
    ]
  }
];





// Utility functions
export const walletUtils = {
  // Convert wei to human readable format
  fromWei: (amount: string, decimals: number): string => {
    const factor = BigInt(10) ** BigInt(decimals);
    const amountBigInt = BigInt(amount);
    const wholePart = amountBigInt / factor;
    const fractionalPart = amountBigInt % factor;
    
    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    if (trimmedFractional === '') {
      return wholePart.toString();
    }
    
    return `${wholePart}.${trimmedFractional}`;
  },

  // Convert human readable to wei
  toWei: (amount: string, decimals: number): string => {
    const factor = BigInt(10) ** BigInt(decimals);
    const amountFloat = parseFloat(amount);
    const amountBigInt = BigInt(Math.floor(amountFloat * (10 ** decimals)));
    return amountBigInt.toString();
  },

  // Create initial wallet structure
  createInitialWallet: (): { [chainId: string]: ChainWallet } => {
    const chains: { [chainId: string]: ChainWallet } = {};

    DEFAULT_WALLET_SETUP.forEach(chainSetup => {
      const tokens: TokenBalance[] = chainSetup.tokens.map(token => ({
        token_address: token.token_address,
        token_symbol: token.token_symbol,
        token_name: token.token_name,
        decimals: token.decimals,
        balance: token.initial_balance,
        formatted_balance: walletUtils.fromWei(token.initial_balance, token.decimals),
        logo_uri: token.logo_uri,
        current_price_usd: '0',
        usd_value: '0'
      }));

      chains[chainSetup.chain_id.toString()] = {
        chain_id: chainSetup.chain_id,
        chain_name: chainSetup.chain_name,
        chain_symbol: chainSetup.chain_symbol,
        tokens,
        total_usd_value: '0'
      };
    });

    return chains;
  },

  // Get token by address in a specific chain
  getTokenInChain: (
    wallet: Wallet, 
    chainId: number, 
    tokenAddress: string
  ): TokenBalance | undefined => {
    const chain = wallet.chains[chainId.toString()];
    if (!chain) return undefined;
    
    return chain.tokens.find(
      token => token.token_address.toLowerCase() === tokenAddress.toLowerCase()
    );
  },

  // Update token balance in wallet
  updateTokenBalance: (
    wallet: Wallet,
    chainId: number,
    tokenAddress: string,
    newBalance: string,
    priceUsd?: string
  ): Wallet => {
    const chainKey = chainId.toString();
    
    if (!wallet.chains[chainKey]) {
      // If chain doesn't exist, we shouldn't add it here
      return wallet;
    }

    const tokenIndex = wallet.chains[chainKey].tokens.findIndex(
      token => token.token_address.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (tokenIndex !== -1) {
      const token = wallet.chains[chainKey].tokens[tokenIndex];
      token.balance = newBalance;
      token.formatted_balance = walletUtils.fromWei(newBalance, token.decimals);
      
      if (priceUsd) {
        token.current_price_usd = priceUsd;
        const balanceFloat = parseFloat(token.formatted_balance);
        token.usd_value = (balanceFloat * parseFloat(priceUsd)).toFixed(2);
      }

      // Recalculate chain total USD value
      wallet.chains[chainKey].total_usd_value = wallet.chains[chainKey].tokens
        .reduce((total, t) => total + parseFloat(t.usd_value || '0'), 0)
        .toFixed(2);
    }

    return wallet;
  },

  // Add new token to wallet chain
  addTokenToChain: (
    wallet: Wallet,
    chainId: number,
    tokenData: {
      token_address: string;
      token_symbol: string;
      token_name: string;
      decimals: number;
      balance?: string;
      logo_uri?: string;
    }
  ): Wallet => {
    const chainKey = chainId.toString();
    
    if (!wallet.chains[chainKey]) {
      return wallet; // Chain doesn't exist
    }

    // Check if token already exists
    const existingTokenIndex = wallet.chains[chainKey].tokens.findIndex(
      token => token.token_address.toLowerCase() === tokenData.token_address.toLowerCase()
    );

    const newToken: TokenBalance = {
      token_address: tokenData.token_address,
      token_symbol: tokenData.token_symbol,
      token_name: tokenData.token_name,
      decimals: tokenData.decimals,
      balance: tokenData.balance || '0',
      formatted_balance: walletUtils.fromWei(tokenData.balance || '0', tokenData.decimals),
      logo_uri: tokenData.logo_uri,
      current_price_usd: '0',
      usd_value: '0'
    };

    if (existingTokenIndex !== -1) {
      // Update existing token
      wallet.chains[chainKey].tokens[existingTokenIndex] = newToken;
    } else {
      // Add new token
      wallet.chains[chainKey].tokens.push(newToken);
    }

    return wallet;
  }
};