export interface VirtualTransaction {
  id: string;
  wallet_id: string;
  transaction_hash: string; // TODO: Generated fake hash for now
  type: 'swap' | 'bridge' | 'limit_order' | 'transfer';
  status: 'pending' | 'completed' | 'failed';
  
  from_token_address: string;
  from_token_symbol: string;
  from_amount: string;
  
  to_token_address: string;
  to_token_symbol: string;
  to_amount: string;
  
  gas_used: string;
  gas_price: string;
  slippage: string;
  protocols_used: string[]; 
  
  
  source_chain_id?: number;
  destination_chain_id?: number;

  oneinch_quote_data: any; 
  
  created_at: Date;
  executed_at?: Date;
}