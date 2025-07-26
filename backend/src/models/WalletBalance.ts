export interface WalletBalance {
  id: string;
  wallet_id: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_decimals: number;
  balance: string; 
  usd_value: string;
  last_updated: Date;
}