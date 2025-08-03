import { Pool } from 'pg';
import { ethers } from 'ethers';
import { VirtualWallet } from '../models/VirtualWallet';
import { Tokens, WalletBalance } from '../models/WalletBalance';
import { VirtualTransaction } from '../models/Transaction';
import { GasPriceResponse, OneInchService } from './oneInchService';
import { ChainWallet, Wallet, WalletResponse, walletUtils } from '../types/wallet';

export class WalletService {
  
  constructor(private db: Pool) {
    
  }

  public async getWalletByUserId(userId: string): Promise<WalletResponse> {
    try {
      const walletResult = await this.db.query(`
        SELECT 
          w.id,
          w.user_id,
          w.chains,
          w.created_at,
          w.updated_at
        FROM wallets w
        WHERE w.user_id = $1
      `, [userId]);

      if (walletResult.rows.length === 0) {
        return {
          success: false,
          message: 'Wallet not found'
        };
      }

      const walletData = walletResult.rows[0];
      
      const wallet: Wallet = {
        id: walletData.id,
        user_id: walletData.user_id,
        chains: walletData.chains || {},
        created_at: walletData.created_at,
        updated_at: walletData.updated_at
      };

      // Calculate total USD value across all chains
      const totalUsdValue = Object.values(wallet.chains).reduce((total, chain: ChainWallet) => {
        return total + parseFloat(chain.total_usd_value || '0');
      }, 0);

      return {
        success: true,
        message: 'Wallet retrieved successfully',
        data: {
          wallet,
          total_usd_value: totalUsdValue.toFixed(2)
        }
      };

    } catch (error) {
      console.error('Get wallet error:', error);
      return {
        success: false,
        message: 'Failed to retrieve wallet'
      };
    }
  }

  public async getWalletByChain(userId: string, chainId: number): Promise<ChainWallet | null> {
    try {
      const walletResult = await this.db.query(`
        SELECT chains
        FROM wallets w
        WHERE w.user_id = $1
      `, [userId]);

      if (walletResult.rows.length === 0) {
        return null;
      }

      const chains = walletResult.rows[0].chains || {};
      return chains[chainId.toString()] || null;

    } catch (error) {
      console.error('Get wallet by chain error:', error);
      return null;
    }
  }

  public async updateTokenBalance(
    userId: string,
    chainId: number,
    tokenAddress: string,
    newBalance: string,
    priceUsd?: string
  ): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get current wallet
      const walletResult = await client.query(`
        SELECT id, chains FROM wallets WHERE user_id = $1 FOR UPDATE
      `, [userId]);

      if (walletResult.rows.length === 0) {
        return false;
      }

      const walletData = walletResult.rows[0];
      const wallet: Wallet = {
        id: walletData.id,
        user_id: userId,
        chains: walletData.chains || {},
        created_at: new Date(),
        updated_at: new Date()
      };

      // Update the token balance
      const updatedWallet = walletUtils.updateTokenBalance(
        wallet,
        chainId,
        tokenAddress,
        newBalance,
        priceUsd
      );

      // Save updated wallet
      await client.query(`
        UPDATE wallets 
        SET chains = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(updatedWallet.chains), wallet.id]);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update token balance error:', error);
      return false;
    } finally {
      client.release();
    }
  }

  public async addTokenToWallet(
    userId: string,
    chainId: number,
    tokenData: {
      token_address: string;
      token_symbol: string;
      token_name: string;
      decimals: number;
      balance?: string;
      logo_uri?: string;
    }
  ): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get current wallet
      const walletResult = await client.query(`
        SELECT id, chains FROM wallets WHERE user_id = $1 FOR UPDATE
      `, [userId]);

      if (walletResult.rows.length === 0) {
        return false;
      }

      const walletData = walletResult.rows[0];
      const wallet: Wallet = {
        id: walletData.id,
        user_id: userId,
        chains: walletData.chains || {},
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add token to wallet
      const updatedWallet = walletUtils.addTokenToChain(wallet, chainId, tokenData);

      // Save updated wallet
      await client.query(`
        UPDATE wallets 
        SET chains = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(updatedWallet.chains), wallet.id]);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Add token to wallet error:', error);
      return false;
    } finally {
      client.release();
    }
  }

  public async simulateSwap(
    userId: string,
    fromChainId: number,
    fromTokenAddress: string,
    fromAmount: string,
    toChainId: number,
    toTokenAddress: string,
    toAmount: string,
    toTokenDecimals?:number,
    toTokenName?:string,
    toTokenSymbol?:string,
    toTokenURI?:string
  ): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get current wallet
      const walletResult = await client.query(`
        SELECT id, chains FROM wallets WHERE user_id = $1 FOR UPDATE
      `, [userId]);

      if (walletResult.rows.length === 0) {
        return false;
      }

      const walletData = walletResult.rows[0];
      // const wallet: Wallet = {
      //   id: walletData.id,
      //   user_id: userId,
      //   chains: walletData.chains || {},
      //   created_at: new Date(),
      //   updated_at: new Date()
      // };
      const wallet: Wallet = {
        ...walletResult.rows[0],
        chains: walletResult.rows[0].chains || {}
      };

      // Get current balances
      const fromToken = walletUtils.getTokenInChain(wallet, fromChainId, fromTokenAddress);
      if (!fromToken) {
        throw new Error('Source token not found in wallet');
      }

      // Check if user has sufficient balance
      const currentBalance = BigInt(fromToken.balance);
      const swapAmount = BigInt(fromAmount);
      
      if (currentBalance < swapAmount) {
        throw new Error('Insufficient balance for swap');
      }

      // Deduct from source token
      const newFromBalance = (currentBalance - swapAmount).toString();
      const updatedWallet1 = walletUtils.updateTokenBalance(
        wallet,
        fromChainId,
        fromTokenAddress,
        newFromBalance
      );

      // Handle destination token (might not exist yet)
      let finalWallet = updatedWallet1;

      // Initialize chain if it doesn't exist
      if (!finalWallet.chains[toChainId]) {
        const chainNames: { [key: number]: { name: string; symbol: string } } = {
          1: { name: 'Ethereum', symbol: 'ETH' },
          137: { name: 'Polygon', symbol: 'POL' },
          42161: { name: 'Arbitrum', symbol: 'ETH' },
          10: { name: 'Optimism', symbol: 'ETH' },
          56: { name: 'BNB Chain', symbol: 'BNB' },
          43114:{name:'Avalanche',symbol:''},
          8453:{name:'Base',symbol:''},
          100:{name:'Gnosis',symbol:''},
          59144:{name:'Linea',symbol:''},
          146:{name:'Sonic',symbol:''},
          130:{name:'Unichain',symbol:''},
          324:{name:'ZkSync',symbol:''},
        };

        const chainInfo = chainNames[Number(toChainId)];
        finalWallet.chains[toChainId] = {
          chain_id: toChainId,
          chain_name: chainInfo.name, 
          chain_symbol: chainInfo.symbol, 
          tokens: [],
          total_usd_value: "0"
        };
      }
      const toChain = wallet.chains[toChainId];
      //let toToken = toChain.tokens.find(t => t.token_address === toTokenAddress);

      const toToken = walletUtils.getTokenInChain(updatedWallet1, toChainId, toTokenAddress);
      
      if (toToken) {
        // Token exists, add to current balance
        const currentToBalance = BigInt(toToken.balance);
        const addAmount = BigInt(toAmount);
        const newToBalance = (currentToBalance + addAmount).toString();
        
        finalWallet = walletUtils.updateTokenBalance(
          updatedWallet1,
          toChainId,
          toTokenAddress,
          newToBalance
        );
       
      } else {
        // Token doesn't exist, need to add it first
        // For now, i'll need to know token details. In a real implementation,
        // this info would come from the swap quote
        console.log(`Adding new token ${toTokenAddress} to chain ${toChainId}`);
        this.addTokenToChain(
          userId,
          toChainId,
          {
            token_address:toTokenAddress,
            token_symbol:toTokenSymbol!,
            token_name:toTokenName!,
            decimals:toTokenDecimals!,
            balance: toAmount,
            logo_uri:toTokenURI!
          })
        
        // For simulation, i'll just update the balance assuming the token exists
        finalWallet = walletUtils.updateTokenBalance(
          updatedWallet1,
          toChainId,
          toTokenAddress,
          toAmount

        );
        
      }

      // Save updated wallet
      await client.query(`
        UPDATE wallets 
        SET chains = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(finalWallet.chains), wallet.id]);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Simulate swap error:', error);
      return false;
    } finally {
      client.release();
    }
  }

  public async addTokenToChain(
    userId: string,
    chainId: number,
    tokenData: {
      token_address: string;
      token_symbol: string;
      token_name: string;
      decimals: number;
      balance?: string;
      logo_uri?: string;
    }
  ): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get current wallet
      const walletResult = await client.query(`
        SELECT id, chains FROM wallets WHERE user_id = $1 FOR UPDATE
      `, [userId]);

      if (walletResult.rows.length === 0) {
        return false;
      }

      const walletData = walletResult.rows[0];
      const wallet: Wallet = {
        id: walletData.id,
        user_id: userId,
        chains: walletData.chains || {},
        created_at: new Date(),
        updated_at: new Date()
      };

      // Ensure chain exists
      const chainKey = chainId.toString();
      if (!wallet.chains[chainKey]) {
        // Create new chain if it doesn't exist
        const chainNames: { [key: number]: { name: string; symbol: string } } = {
          1: { name: 'Ethereum', symbol: 'ETH' },
          137: { name: 'Polygon', symbol: 'POL' },
          42161: { name: 'Arbitrum', symbol: 'ETH' },
          10: { name: 'Optimism', symbol: 'ETH' },
          56: { name: 'BNB Chain', symbol: 'BNB' },
          43114:{name:'Avalanche',symbol:''},
          8453:{name:'Base',symbol:''},
          100:{name:'Gnosis',symbol:''},
          59144:{name:'Linea',symbol:''},
          146:{name:'Sonic',symbol:''},
          130:{name:'Unichain',symbol:''},
          324:{name:'ZkSync',symbol:''},
        };

        const chainInfo = chainNames[Number(chainId)];
        console.log('chainInfo for', chainId, chainInfo);

        
        wallet.chains[chainKey] = {
          chain_id: chainId,
          chain_name: chainInfo.name,
          chain_symbol: chainInfo.symbol,
          tokens: [],
          total_usd_value: '0'
        };
      }

      // Add token to chain
      const updatedWallet = walletUtils.addTokenToChain(wallet, chainId, tokenData);
      // Save updated wallet
      await client.query(`
        UPDATE wallets 
        SET chains = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(updatedWallet.chains), wallet.id]);

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Add token to chain error:', error);
      return false;
    } finally {
      client.release();
    }
  }

  public async getTokenBalance(
    userId: string,
    chainId: number,
    tokenAddress: string
  ): Promise<{ balance: string; formatted_balance: string } | null> {
    try {
      const walletResult = await this.db.query(`
        SELECT chains FROM wallets WHERE user_id = $1
      `, [userId]);

      if (walletResult.rows.length === 0) {
        return null;
      }

      const chains = walletResult.rows[0].chains || {};
      const wallet: Wallet = {
        id: '',
        user_id: userId,
        chains,
        created_at: new Date(),
        updated_at: new Date()
      };

      const token = walletUtils.getTokenInChain(wallet, chainId, tokenAddress);
      
      if (!token) {
        return null;
      }

      return {
        balance: token.balance,
        formatted_balance: token.formatted_balance
      };

    } catch (error) {
      console.error('Get token balance error:', error);
      return null;
    }
  }

   public async refreshWalletPrices(userId: string): Promise<boolean> {
    // This method will be implemented later to fetch real-time prices
    // from 1inch API and update USD values
    try {
      // TODO: Implement price fetching logic
      console.log('Refreshing wallet prices for user:', userId);
      return true;
    } catch (error) {
      console.error('Refresh wallet prices error:', error);
      return false;
    }
  }

 
}