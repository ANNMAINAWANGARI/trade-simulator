import { Pool } from 'pg';
import { CREATE_TABLES_SQL } from '../types/database';

export class Database {
  private pool: Pool;
    
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  getPool(): Pool {
    return this.pool;
  }

  async initialize(): Promise<void> {
    try {
      // Create tables if they don't exist
      await this.pool.query(CREATE_TABLES_SQL);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const dbHelpers = {
  
  // Generate UUID v4
  generateId: (): string => {
    // Returns: "550e8400-e29b-41d4-a716-446655440000"
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Create initial wallet with default tokens
  createInitialWalletData: () => {
    return {
      "1": {                                    // Ethereum chain
        "chain_id": 1,
        "chain_name": "Ethereum",
        "chain_symbol": "ETH", 
        "tokens": [
          {
            "token_address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            "token_symbol": "ETH",
            "token_name": "Ethereum",
            "decimals": 18,
            "balance": "10000000000000000000",        // 10 ETH in wei
            "formatted_balance": "10.0",
            "logo_uri": "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
            "current_price_usd": "0",
            "usd_value": "0"
          },
          {
            "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "token_symbol": "USDC", 
            "token_name": "USD Coin",
            "decimals": 6,
            "balance": "10000000",                    // 10 USDC (6 decimals)
            "formatted_balance": "10.0",
            "logo_uri": "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
            "current_price_usd": "0",
            "usd_value": "0"
          }
        ],
        "total_usd_value": "0"
      },
      "137": {                                  // Polygon chain
        "chain_id": 137,
        "chain_name": "Polygon", 
        "chain_symbol": "POL",
        "tokens": [
          {
            "token_address": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
            "token_symbol": "USDC",
            "token_name": "USD Coin", 
            "decimals": 6,
            "balance": "10000000",                    // 10 USDC on Polygon
            "formatted_balance": "10.0",
            "logo_uri": "https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png",
            "current_price_usd": "0",
            "usd_value": "0"
          }
        ],
        "total_usd_value": "0"
      }
    };
  }
};