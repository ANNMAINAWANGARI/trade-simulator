export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export const CREATE_TABLES_SQL = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Virtual wallets table
  CREATE TABLE IF NOT EXISTS virtual_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(42) UNIQUE NOT NULL,
    chain_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Wallet balances table
  CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES virtual_wallets(id) ON DELETE CASCADE,
    token_address VARCHAR(42) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    token_name VARCHAR(100) NOT NULL,
    token_decimals INTEGER NOT NULL,
    balance DECIMAL(78, 0) NOT NULL DEFAULT 0,
    usd_value DECIMAL(20, 8) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, token_address)
  );

  -- Virtual transactions table
  CREATE TABLE IF NOT EXISTS virtual_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES virtual_wallets(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('swap', 'bridge', 'limit_order', 'transfer')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    
    from_token_address VARCHAR(42) NOT NULL,
    from_token_symbol VARCHAR(20) NOT NULL,
    from_amount DECIMAL(78, 0) NOT NULL,
    
    to_token_address VARCHAR(42) NOT NULL,
    to_token_symbol VARCHAR(20) NOT NULL,
    to_amount DECIMAL(78, 0) NOT NULL,
    
    gas_used DECIMAL(20, 0) DEFAULT 0,
    gas_price DECIMAL(20, 0) DEFAULT 0,
    slippage DECIMAL(5, 4) DEFAULT 0,
    protocols_used JSONB DEFAULT '[]',
    
    source_chain_id INTEGER,
    destination_chain_id INTEGER,
    
    oneinch_quote_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP
  );

  -- Indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_virtual_wallets_user_id ON virtual_wallets(user_id);
  CREATE INDEX IF NOT EXISTS idx_wallet_balances_wallet_id ON wallet_balances(wallet_id);
  CREATE INDEX IF NOT EXISTS idx_virtual_transactions_wallet_id ON virtual_transactions(wallet_id);
  CREATE INDEX IF NOT EXISTS idx_virtual_transactions_status ON virtual_transactions(status);
  CREATE INDEX IF NOT EXISTS idx_virtual_transactions_created_at ON virtual_transactions(created_at DESC);
`;

// Seed data for testing
export const SEED_DATA = {
  // Default tokens to initialize new wallets with
  DEFAULT_TOKENS: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH 
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      initial_balance: '10000000000000000000' // 10 ETH
    },
    {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC 
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      initial_balance: '1000000000' // 1000 USDC
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT 
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      initial_balance: '500000000' // 500 USDT
    }
  ]
};