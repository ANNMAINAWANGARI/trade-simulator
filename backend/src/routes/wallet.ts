import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import {  createAuthMiddleware } from '../middleware/auth';
import { validateWalletCreation, validateBalanceCheck } from '../middleware/validation';
import { Pool } from 'pg';

export function createWalletRoutes(db: Pool): Router {
  const router = Router();
  const walletController = new WalletController(db);
  const authMiddleware = createAuthMiddleware(db);


  // All wallet routes require authentication
  router.use(authMiddleware);

  // Wallet routes
  router.get('/', walletController.getWallet);
  router.get('/summary', walletController.getWalletSummaryWithPrices);
  router.get('/chain/:chainId', walletController.getWalletByChain);
  
  // Token management
  router.get('/token-balance', walletController.getTokenBalance);
  router.post('/tokens/add-to-chain', walletController.addTokenToChain);
  router.put('/tokens/balance', walletController.updateTokenBalance);
  
  // Swap-related validation
  router.post('/validate-swap', walletController.validateSwapRequirement);
  
  // Legacy swap simulation (kept for backward compatibility)
  router.post('/simulate-swap', walletController.simulateSwap);
  
  // Price updates
  router.post('/refresh-prices', walletController.refreshPrices);
  return router;
}