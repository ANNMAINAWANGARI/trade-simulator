import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';
import { validateWalletCreation, validateBalanceCheck } from '../middleware/validation';
import { Pool } from 'pg';

export function createWalletRoutes(db: Pool): Router {
  const router = Router();
  const walletController = new WalletController(db);

  // All wallet routes require authentication
  router.use(authMiddleware);

  // POST /api/wallet - Create new virtual wallet
  router.post('/', validateWalletCreation, walletController.createWallet);

  // GET /api/wallet - Get user's wallets
  router.get('/', walletController.getUserWallets);

  // GET /api/wallet/:walletId - Get specific wallet details
  router.get('/:walletId', walletController.getWalletDetails);

  // GET /api/wallet/:walletId/balances - Get wallet balances
  router.get('/:walletId/balances', walletController.getWalletBalances);

  // GET /api/wallet/:walletId/transactions - Get transaction history
  router.get('/:walletId/transactions', walletController.getTransactionHistory);

  // GET /api/wallet/:walletId/summary - Get portfolio summary
  router.get('/:walletId/summary', walletController.getPortfolioSummary);

  // POST /api/wallet/:walletId/validate-balance - Validate balance for trade
  router.post('/:walletId/validate-balance', validateBalanceCheck, walletController.validateBalance);

  return router;
}