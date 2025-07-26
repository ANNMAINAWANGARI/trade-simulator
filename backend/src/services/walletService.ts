import { Pool } from 'pg';
import { ethers } from 'ethers';
import { VirtualWallet } from '../models/VirtualWallet';
import { SEED_DATA } from '../types/database';
import { WalletBalance } from '../models/WalletBalance';
import { VirtualTransaction } from '../models/Transaction';

export class WalletService {
  constructor(private db: Pool) {}

  // Generate a random virtual wallet address
  private generateVirtualAddress(): string {
    return ethers.Wallet.createRandom().address;
  }
  // Generate a fake transaction hash
  private generateTransactionHash(): string {
    return ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString() + Math.random().toString()));
  }
  // Create a new virtual wallet for a user
  async createWallet(userId: string, chainId: number = 1, name: string = 'Ethereum Wallet'): Promise<VirtualWallet> {
    const address = this.generateVirtualAddress();
    
    const query = `
      INSERT INTO virtual_wallets (user_id, address, chain_id, name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await this.db.query(query, [userId, address, chainId, name]);
    const wallet = result.rows[0];

    // Initialize wallet with default tokens
    await this.initializeWalletBalances(wallet.id);
    
    return wallet;
  }
  // Initialize wallet with starting balances
  private async initializeWalletBalances(walletId: string): Promise<void> {
    const insertQuery = `
      INSERT INTO wallet_balances (wallet_id, token_address, token_symbol, token_name, token_decimals, balance)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const token of SEED_DATA.DEFAULT_TOKENS) {
      await this.db.query(insertQuery, [
        walletId,
        token.address,
        token.symbol,
        token.name,
        token.decimals,
        token.initial_balance
      ]);
    }
  }
  // Get user's wallets
  async getUserWallets(userId: string): Promise<VirtualWallet[]> {
    const query = `
      SELECT * FROM virtual_wallets 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }
  // Get wallet by ID
  async getWalletById(walletId: string, userId: string): Promise<VirtualWallet | null> {
    const query = `
      SELECT * FROM virtual_wallets 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await this.db.query(query, [walletId, userId]);
    return result.rows[0] || null;
  }
  // Get wallet balances
  async getWalletBalances(walletId: string): Promise<WalletBalance[]> {
    const query = `
      SELECT * FROM wallet_balances 
      WHERE wallet_id = $1 
      ORDER BY usd_value DESC
    `;
    
    const result = await this.db.query(query, [walletId]);
    return result.rows;
  }
  // Get specific token balance
  async getTokenBalance(walletId: string, tokenAddress: string): Promise<WalletBalance | null> {
    const query = `
      SELECT * FROM wallet_balances 
      WHERE wallet_id = $1 AND token_address = $2
    `;
    
    const result = await this.db.query(query, [walletId, tokenAddress]);
    return result.rows[0] || null;
  }
  // Update token balance
  async updateTokenBalance(
    walletId: string, 
    tokenAddress: string, 
    newBalance: string, 
    usdValue?: string
  ): Promise<void> {
    const query = `
      UPDATE wallet_balances 
      SET balance = $3, usd_value = COALESCE($4, usd_value), last_updated = CURRENT_TIMESTAMP
      WHERE wallet_id = $1 AND token_address = $2
    `;
    
    await this.db.query(query, [walletId, tokenAddress, newBalance, usdValue]);
  }
  // Add new token to wallet (if user receives a new token)
  async addTokenToWallet(
    walletId: string,
    tokenAddress: string,
    tokenSymbol: string,
    tokenName: string,
    tokenDecimals: number,
    balance: string = '0'
  ): Promise<void> {
    const query = `
      INSERT INTO wallet_balances (wallet_id, token_address, token_symbol, token_name, token_decimals, balance)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (wallet_id, token_address) 
      DO UPDATE SET balance = wallet_balances.balance + EXCLUDED.balance
    `;
    
    await this.db.query(query, [walletId, tokenAddress, tokenSymbol, tokenName, tokenDecimals, balance]);
  }
   async executeVirtualTrade(params: {
    walletId: string;
    fromTokenAddress: string;
    fromTokenSymbol: string;
    fromAmount: string;
    toTokenAddress: string;
    toTokenSymbol: string;
    toAmount: string;
    gasUsed: string;
    gasPrice: string;
    slippage: string;
    protocolsUsed: string[];
    oneInchQuoteData: any;
    type?: 'swap' | 'bridge';
  }): Promise<VirtualTransaction> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Check if user has sufficient balance
      const fromBalance = await this.getTokenBalance(params.walletId, params.fromTokenAddress);
      if (!fromBalance || BigInt(fromBalance.balance) < BigInt(params.fromAmount)) {
        throw new Error('Insufficient balance');
      }

      // 2. Create transaction record
      const transactionHash = this.generateTransactionHash();
      const transactionQuery = `
        INSERT INTO virtual_transactions (
          wallet_id, transaction_hash, type, status,
          from_token_address, from_token_symbol, from_amount,
          to_token_address, to_token_symbol, to_amount,
          gas_used, gas_price, slippage, protocols_used,
          oneinch_quote_data, executed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const transactionResult = await client.query(transactionQuery, [
        params.walletId,
        transactionHash,
        params.type || 'swap',
        'completed',
        params.fromTokenAddress,
        params.fromTokenSymbol,
        params.fromAmount,
        params.toTokenAddress,
        params.toTokenSymbol,
        params.toAmount,
        params.gasUsed,
        params.gasPrice,
        params.slippage,
        JSON.stringify(params.protocolsUsed),
        JSON.stringify(params.oneInchQuoteData)
      ]);

      // 3. Update from token balance (deduct)
      const newFromBalance = (BigInt(fromBalance.balance) - BigInt(params.fromAmount)).toString();
      await client.query(
        'UPDATE wallet_balances SET balance = $3, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = $1 AND token_address = $2',
        [params.walletId, params.fromTokenAddress, newFromBalance]
      );

      // 4. Update to token balance (add)
      const toBalance = await this.getTokenBalance(params.walletId, params.toTokenAddress);
      if (toBalance) {
        const newToBalance = (BigInt(toBalance.balance) + BigInt(params.toAmount)).toString();
        await client.query(
          'UPDATE wallet_balances SET balance = $3, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = $1 AND token_address = $2',
          [params.walletId, params.toTokenAddress, newToBalance]
        );
      } else {
        // Add new token if it doesn't exist
        await client.query(
          'INSERT INTO wallet_balances (wallet_id, token_address, token_symbol, token_name, token_decimals, balance) VALUES ($1, $2, $3, $4, $5, $6)',
          [params.walletId, params.toTokenAddress, params.toTokenSymbol, params.toTokenSymbol, 18, params.toAmount]
        );
      }

      // 5. Deduct gas fees (from ETH balance)
      const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      const ethBalance = await this.getTokenBalance(params.walletId, ethAddress);
      if (ethBalance) {
        const gasCost = (BigInt(params.gasUsed) * BigInt(params.gasPrice)).toString();
        const newEthBalance = (BigInt(ethBalance.balance) - BigInt(gasCost)).toString();
        await client.query(
          'UPDATE wallet_balances SET balance = $3, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = $1 AND token_address = $2',
          [params.walletId, ethAddress, newEthBalance]
        );
      }

      await client.query('COMMIT');
      return transactionResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  // Get transaction history
  async getTransactionHistory(walletId: string, limit: number = 50, offset: number = 0): Promise<VirtualTransaction[]> {
    const query = `
      SELECT * FROM virtual_transactions 
      WHERE wallet_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.db.query(query, [walletId, limit, offset]);
    return result.rows;
  }
  // Get portfolio summary
  async getPortfolioSummary(walletId: string): Promise<{
    totalValue: string;
    balances: WalletBalance[];
    transactionCount: number;
  }> {
    const balances = await this.getWalletBalances(walletId);
    
    const totalValue = balances.reduce((sum, balance) => {
      return sum + parseFloat(balance.usd_value || '0');
    }, 0).toString();

    const countQuery = 'SELECT COUNT(*) FROM virtual_transactions WHERE wallet_id = $1';
    const countResult = await this.db.query(countQuery, [walletId]);
    const transactionCount = parseInt(countResult.rows[0].count);

    return {
      totalValue,
      balances,
      transactionCount
    };
  }
  // Validate sufficient balance for trade
  async validateTradeBalance(walletId: string, tokenAddress: string, amount: string): Promise<boolean> {
    const balance = await this.getTokenBalance(walletId, tokenAddress);
    if (!balance) return false;
    
    return BigInt(balance.balance) >= BigInt(amount);
  }
  async getWalletTotalValue(walletId: string): Promise<string> {
    const query = `
      SELECT COALESCE(SUM(usd_value), 0) as total_value 
      FROM wallet_balances 
      WHERE wallet_id = $1
    `;
    
    const result = await this.db.query(query, [walletId]);
    return result.rows[0].total_value || '0';
  }
}