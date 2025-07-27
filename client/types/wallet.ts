export interface VirtualWallet {
  id: string;
  user_id: string;
  address: string;
  chain_id: number;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface WalletBalance {
  id: string;
  wallet_id: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_decimals: number;
  balance: string;
  usd_value: string;
  last_updated: Date | string;
}

export interface VirtualTransaction {
  id: string;
  wallet_id: string;
  transaction_hash: string;
  type: 'swap' | 'bridge' | 'limit_order' | 'transfer';
  status: 'pending' | 'completed' | 'failed';
  
  // From token
  from_token_address: string;
  from_token_symbol: string;
  from_amount: string;
  
  // To token
  to_token_address: string;
  to_token_symbol: string;
  to_amount: string;
  
  // Transaction details
  gas_used: string;
  gas_price: string;
  slippage: string;
  protocols_used: string[];
  
  // Cross-chain specific
  source_chain_id?: number;
  destination_chain_id?: number;
  
  // 1inch specific data
  oneinch_quote_data: any;
  
  created_at: Date | string;
  executed_at?: Date | string;
}

export interface PortfolioSummary {
  totalValue: string;
  balances: WalletBalance[];
  transactionCount: number;
}