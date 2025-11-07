import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budgetService';
import { CreateMonthlyGoalRequest, CreateTransactionRequest, ApiResponse } from '../types';
import { createError } from '../middleware/errorHandler';

export class BudgetController {
  /**
   * Get dashboard summary data
   */
  static async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      const summary = await BudgetService.getDashboardSummary(user.id);
      
      const response: ApiResponse = {
        success: true,
        data: summary,
        message: 'Dashboard summary retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's monthly goal
   */
  static async getMonthlyGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      const goal = await BudgetService.getCurrentMonthlyGoal(user.id);
      
      const response: ApiResponse = {
        success: true,
        data: goal,
        message: goal ? 'Monthly goal retrieved successfully' : 'No monthly goal found'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update monthly goal
   */
  static async createMonthlyGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const goalData: CreateMonthlyGoalRequest = req.body;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      const goal = await BudgetService.createMonthlyGoal(user.id, goalData);
      
      const response: ApiResponse = {
        success: true,
        data: goal,
        message: 'Monthly goal created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's transactions
   */
  static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      const transactions = await BudgetService.getCurrentMonthTransactions(user.id);
      
      const response: ApiResponse = {
        success: true,
        data: transactions,
        message: 'Transactions retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const transactionData: CreateTransactionRequest = req.body;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      const transaction = await BudgetService.createTransaction(user.id, transactionData);
      
      const response: ApiResponse = {
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { transactionId } = req.params;
      const updates = req.body;

      if (!user) {
        throw createError('User not found', 404);
      }
      if (!transactionId) {
        throw createError('Transaction ID is required', 400);
      }

      const transaction = await BudgetService.updateTransaction(user.id, transactionId, updates);

      const response: ApiResponse = {
        success: true,
        data: transaction,
        message: 'Transaction updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's monthly history
   */
  static async getMonthlyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      const history = await BudgetService.getMonthlyHistory(user.id);
      
      const response: ApiResponse = {
        success: true,
        data: history,
        message: 'Monthly history retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's categories
   */
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      const categories = await BudgetService.getUserCategories(user.id);
      
      const response: ApiResponse = {
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const categoryData = req.body;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      if (!categoryData.name || !categoryData.color || !categoryData.icon) {
        throw createError('Name, color, and icon are required', 400);
      }

      const category = await BudgetService.createCategory(user.id, categoryData);
      
      const response: ApiResponse = {
        success: true,
        data: category,
        message: 'Category created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { categoryId } = req.params;
      
      if (!user) {
        throw createError('User not found', 404);
      }

      if (!categoryId) {
        throw createError('Category ID is required', 400);
      }

      await BudgetService.deleteCategory(user.id, categoryId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Category deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
