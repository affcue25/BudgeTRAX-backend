import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All budget routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/budget/goals
 * @desc    Get user's monthly goals
 * @access  Private
 */
router.get('/goals', (req, res) => {
  res.json({
    success: true,
    message: 'Get monthly goals endpoint - to be implemented'
  });
});

/**
 * @route   POST /api/budget/goals
 * @desc    Create a new monthly goal
 * @access  Private
 */
router.post('/goals', (req, res) => {
  res.json({
    success: true,
    message: 'Create monthly goal endpoint - to be implemented'
  });
});

/**
 * @route   GET /api/budget/transactions
 * @desc    Get user's transactions
 * @access  Private
 */
router.get('/transactions', (req, res) => {
  res.json({
    success: true,
    message: 'Get transactions endpoint - to be implemented'
  });
});

/**
 * @route   POST /api/budget/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/transactions', (req, res) => {
  res.json({
    success: true,
    message: 'Create transaction endpoint - to be implemented'
  });
});

/**
 * @route   GET /api/budget/history
 * @desc    Get user's monthly history
 * @access  Private
 */
router.get('/history', (req, res) => {
  res.json({
    success: true,
    message: 'Get monthly history endpoint - to be implemented'
  });
});

export default router;
