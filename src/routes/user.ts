import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint - to be implemented'
  });
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Update user profile endpoint - to be implemented'
  });
});

export default router;
