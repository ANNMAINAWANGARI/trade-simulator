import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRegistration, validateLogin } from '../middleware/validation';
import { Pool } from 'pg';

export function createAuthRoutes(db: Pool): Router {
  const router = Router();
  const authController = new AuthController(db);

  // POST /api/auth/register - Register new user
  router.post('/register', validateRegistration, authController.register);

  // POST /api/auth/login - Login user
  router.post('/login', validateLogin, authController.login);

  // POST /api/auth/refresh - Refresh JWT token
  router.post('/refresh', authController.refreshToken);

  // GET /api/auth/me - Get current user info (requires auth)
  router.get('/me', authController.getCurrentUser);

  return router;
}