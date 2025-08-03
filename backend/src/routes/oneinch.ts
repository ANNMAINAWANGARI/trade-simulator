import { Router } from 'express';
import { OneInchController } from '../controllers/oneInchController';
import {  createAuthMiddleware } from '../middleware/auth';
import { validateSwapSimulation, validateVirtualSwap } from '../middleware/validation';
import { Pool } from 'pg';

export function createOneInchRoutes(db: Pool): Router {
  const router = Router();
  const oneInchController = new OneInchController(db);
  const authMiddleware = createAuthMiddleware(db);
  router.use(authMiddleware);

  router.get('/health', oneInchController.healthCheck);
  router.get('/tokens/:chainId', oneInchController.getTokens);
  router.get('/price/:chainId/:tokenAddress', oneInchController.getSpotPrice);
  router.get('/prices/:chainId', oneInchController.getTokenPrices);
  router.get('/gas-price/:chainId', oneInchController.getGasPrice);
  router.get('/preview',oneInchController.previewSwap)
 
  
  router.get('/market-data/:chainId', oneInchController.getMarketData);
  




  router.get('/quote', oneInchController.getSwapQuote);
  router.get('/cross-chain-quote', oneInchController.getCrossChainQuote);
  router.get('/popular-pairs/:chainId', oneInchController.getPopularPairs);
  router.get('/calculate-amount', oneInchController.calculateAmount);

  // Protected routes (authentication required)
  router.post('/preview', authMiddleware, oneInchController.previewSwap);
  router.post('/execute', authMiddleware, oneInchController.executeSwap);
  router.get('/history', authMiddleware, oneInchController.getSwapHistory);

  return router;

}