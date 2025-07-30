
export interface WalletBalance {
  id: string;
  wallet_id: string;
  tokens:Tokens[];
  created_at: Date;
  updated_at: Date;
}
export interface Tokens{
  chain_id:number;
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_decimals: number;
  balance:string;
  usd_value?: number;
}