import { supabase, supabaseAdmin } from '../config/database';
import { CreateMonthlyGoalRequest, CreateTransactionRequest, MonthlyGoal, Transaction, CategoryExpense } from '../types';
import { createError } from '../middleware/errorHandler';

export class BudgetService {
  /**
   * Get user's monthly goal for current month
   */
  static async getCurrentMonthlyGoal(userId: string): Promise<MonthlyGoal | null> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: goal, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw createError('Failed to fetch monthly goal', 500);
      }

      return goal || null;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Get monthly goal error:', error);
      throw createError('Failed to fetch monthly goal', 500);
    }
  }

  /**
   * Create or update monthly goal
   */
  static async createMonthlyGoal(userId: string, goalData: CreateMonthlyGoalRequest): Promise<MonthlyGoal> {
    try {
      const { data: goal, error } = await supabase
        .from('monthly_goals')
        .upsert({
          user_id: userId,
          month: goalData.month,
          income: goalData.income,
          expenses: goalData.expenses,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,month'
        })
        .select()
        .single();

      if (error) {
        throw createError('Failed to create monthly goal', 500);
      }

      return goal;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Create monthly goal error:', error);
      throw createError('Failed to create monthly goal', 500);
    }
  }

  /**
   * Get user's transactions for current month
   */
  static async getCurrentMonthTransactions(userId: string): Promise<Transaction[]> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .order('date', { ascending: false });

      if (error) {
        throw createError('Failed to fetch transactions', 500);
      }

      return transactions || [];
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Get transactions error:', error);
      throw createError('Failed to fetch transactions', 500);
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(userId: string, transactionData: CreateTransactionRequest): Promise<Transaction> {
    try {
      const month = new Date(transactionData.date).toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          category_id: transactionData.category_id,
          category_name: transactionData.category_name || 'Unknown',
          amount: transactionData.amount,
          description: transactionData.description,
          date: transactionData.date,
          month: month
        })
        .select()
        .single();

      if (error) {
        throw createError('Failed to create transaction', 500);
      }

      return transaction;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Create transaction error:', error);
      throw createError('Failed to create transaction', 500);
    }
  }

  /**
   * Get dashboard summary data
   */
  static async getDashboardSummary(userId: string): Promise<{
    monthlyGoal: MonthlyGoal | null;
    transactions: Transaction[];
    totalIncome: number;
    totalExpenses: number;
    actualSavings: number;
    expectedSavings: number;
    topCategories: Array<{ category_name: string; amount: number; percentage: number }>;
    monthlyProgress: number;
  }> {
    try {
      const [monthlyGoal, transactions] = await Promise.all([
        this.getCurrentMonthlyGoal(userId),
        this.getCurrentMonthTransactions(userId)
      ]);

      const totalIncome = monthlyGoal?.income || 0;
      const totalExpenses = transactions.reduce((sum, trans) => sum + Number(trans.amount), 0);
      const actualSavings = totalIncome - totalExpenses;
      
      // Calculate expected savings from monthly goal
      const totalExpectedExpenses = monthlyGoal?.expenses?.reduce(
        (sum: number, exp: CategoryExpense) => sum + Number(exp.expected_amount), 0
      ) || 0;
      const expectedSavings = totalIncome - totalExpectedExpenses;

      // Calculate top spending categories
      const categoryTotals = transactions.reduce((acc: Record<string, number>, trans) => {
        acc[trans.category_name] = (acc[trans.category_name] || 0) + Number(trans.amount);
        return acc;
      }, {});

      const topCategories = Object.entries(categoryTotals)
        .map(([category_name, amount]) => ({
          category_name,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate monthly progress (expense progress)
      const monthlyProgress = totalExpectedExpenses > 0 
        ? Math.min((totalExpenses / totalExpectedExpenses) * 100, 100)
        : 0;

      return {
        monthlyGoal,
        transactions,
        totalIncome,
        totalExpenses,
        actualSavings,
        expectedSavings,
        topCategories,
        monthlyProgress
      };
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Get dashboard summary error:', error);
      throw createError('Failed to fetch dashboard data', 500);
    }
  }

  /**
   * Get user's monthly history
   */
  static async getMonthlyHistory(userId: string): Promise<any[]> {
    try {
      const { data: history, error } = await supabase
        .from('monthly_history')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: false });

      if (error) {
        throw createError('Failed to fetch monthly history', 500);
      }

      return history || [];
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Get monthly history error:', error);
      throw createError('Failed to fetch monthly history', 500);
    }
  }

  /**
   * Get user's categories (default + custom)
   */
  static async getUserCategories(userId: string): Promise<any[]> {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        throw createError('Failed to fetch categories', 500);
      }

      return categories || [];
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Get categories error:', error);
      throw createError('Failed to fetch categories', 500);
    }
  }

  /**
   * Create a new user category
   */
  static async createCategory(userId: string, categoryData: {
    name: string;
    color: string;
    icon: string;
  }): Promise<any> {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: categoryData.name,
          color: categoryData.color,
          icon: categoryData.icon,
          is_default: false
        })
        .select()
        .single();

      if (error) {
        throw createError('Failed to create category', 500);
      }

      return category;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Create category error:', error);
      throw createError('Failed to create category', 500);
    }
  }

  /**
   * Delete a user category
   */
  static async deleteCategory(userId: string, categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId)
        .eq('is_default', false); // Only allow deletion of user-created categories

      if (error) {
        throw createError('Failed to delete category', 500);
      }
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Delete category error:', error);
      throw createError('Failed to delete category', 500);
    }
  }
}
