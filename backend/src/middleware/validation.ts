import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateWalletCreation = [
  body('chainId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Chain ID must be a positive integer'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Wallet name must be between 1 and 100 characters'),
  handleValidationErrors
];

export const validateBalanceCheck = [
  body('tokenAddress')
    .isLength({ min: 42, max: 42 })
    .withMessage('Token address must be 42 characters long'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be numeric'),
  handleValidationErrors
];

function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  console.log('🔍 Incoming body:', req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];