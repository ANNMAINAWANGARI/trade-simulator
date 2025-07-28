import { Router } from 'express';
import { OneInchController } from '../controllers/oneInchController';
import { authMiddleware } from '../middleware/auth';
import { validateSwapSimulation, validateVirtualSwap } from '../middleware/validation';
import { Pool } from 'pg';

export function createOneInchRoutes(db: Pool): Router {
  const router = Router();
  const oneInchController = new OneInchController(db);

  router.get('/health', oneInchController.healthCheck);
  router.get('/tokens/:chainId?', oneInchController.getTokens);
  router.get('/price/:chainId/:tokenAddress', oneInchController.getSpotPrice);
  router.get('/prices/:chainId', oneInchController.getTokenPrices);
  router.get('/gas-price/:chainId?', oneInchController.getGasPrice);
  router.get('/quote/:chainId?', oneInchController.getQuote);
  router.use(authMiddleware);
  router.get('/market-data/:chainId?', oneInchController.getMarketData);
  router.post('/simulate-swap', validateSwapSimulation, oneInchController.simulateSwap);
  router.post('/execute-virtual-swap', validateVirtualSwap, oneInchController.executeVirtualSwap);
  router.get('/fusion/quote', oneInchController.getFusionQuote);
  router.get('/fusion/chains', oneInchController.getFusionChains);
  router.get('/limit-orders/:chainId?', oneInchController.getLimitOrders);

  return router;

}