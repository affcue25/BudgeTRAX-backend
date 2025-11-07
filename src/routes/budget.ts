import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { BudgetController } from '../controllers/budgetController';
import { validateRequest } from '../middleware/validation';
import { budgetSchemas } from '../middleware/validation';

const router = Router();

// All budget routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/budget/dashboard
 * @desc    Get dashboard summary data
 * @access  Private
 */
router.get('/dashboard', BudgetController.getDashboardSummary);

/**
 * @route   GET /api/budget/goals
 * @desc    Get user's monthly goals
 * @access  Private
 */
router.get('/goals', BudgetController.getMonthlyGoal);

/**
 * @route   POST /api/budget/goals
 * @desc    Create a new monthly goal
 * @access  Private
 */
router.post('/goals', validateRequest(budgetSchemas.createMonthlyGoal), BudgetController.createMonthlyGoal);

/**
 * @route   GET /api/budget/transactions
 * @desc    Get user's transactions
 * @access  Private
 */
router.get('/transactions', BudgetController.getTransactions);

/**
 * @route   POST /api/budget/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/transactions', validateRequest(budgetSchemas.createTransaction), BudgetController.createTransaction);

/**
 * @route   PUT /api/budget/transactions/:transactionId
 * @desc    Update a transaction
 * @access  Private
 */
router.put('/transactions/:transactionId', validateRequest(budgetSchemas.updateTransaction), BudgetController.updateTransaction);

/**
 * @route   GET /api/budget/history
 * @desc    Get user's monthly history
 * @access  Private
 */
router.get('/history', BudgetController.getMonthlyHistory);

/**
 * @route   GET /api/budget/categories
 * @desc    Get user's categories
 * @access  Private
 */
router.get('/categories', BudgetController.getCategories);

/**
 * @route   POST /api/budget/categories
 * @desc    Create a new category
 * @access  Private
 */
router.post('/categories', BudgetController.createCategory);

/**
 * @route   DELETE /api/budget/categories/:categoryId
 * @desc    Delete a category
 * @access  Private
 */
router.delete('/categories/:categoryId', BudgetController.deleteCategory);

export default router;
