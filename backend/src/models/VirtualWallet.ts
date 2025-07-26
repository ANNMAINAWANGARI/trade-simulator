export interface VirtualWallet {
  id: string;
  user_id: string;
  address: string; // Generated virtual address
  chain_id: number;
  name: string; // e.g., "Main Wallet", "Ethereum Wallet"
  created_at: Date;
  updated_at: Date;
}