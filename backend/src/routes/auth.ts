import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { Pool } from 'pg';
import { createAuthMiddleware } from '../middleware/auth';

export function createAuthRoutes(db: Pool): Router {
  const router = Router();
  const authController = new AuthController(db);
  const authMiddleware = createAuthMiddleware(db);


  router.post('/register', authController.register);
  router.post('/login', authController.login);


  // Protected routes
  router.get('/profile', authMiddleware, authController.getProfile);
  router.get('/profile-with-wallet', authMiddleware, authController.getProfileWithWallet);
  router.post('/refresh-token', authMiddleware, authController.refreshToken);
  

  return router;
}