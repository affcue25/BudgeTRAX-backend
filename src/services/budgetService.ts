import { supabase, supabaseAdmin } from '../config/database';
import { CreateMonthlyGoalRequest, CreateTransactionRequest, MonthlyGoal, Transaction, CategoryExpense } from '../types';
import { createError } from '../middleware/errorHandler';

export class BudgetService {
  private static isUuid(value: string | undefined | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private static async resolveCategoryId(
    userId: string,
    categoryId: string | undefined,
    categoryName?: string,
    createIfMissing: boolean = true
  ): Promise<{ id: string; name: string } | null> {
    // If valid UUID, try to fetch to ensure it exists and belongs to user or default
    if (this.isUuid(categoryId || '')) {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id,name')
        .eq('id', categoryId as string)
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .maybeSingle();
      if (!error && data) return { id: data.id, name: data.name };
    }

    // Fallback: resolve by name across user's categories or defaults
    if (categoryName && categoryName.trim().length > 0) {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id,name')
        .eq('name', categoryName)
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .limit(1)
        .maybeSingle();
      if (!error && data) return { id: data.id, name: data.name };
    }

    // If still not found and allowed, create a user-scoped category using provided name or a derived name from slug
    if (createIfMissing) {
      let derivedName = categoryName;
      if ((!derivedName || derivedName.trim().length === 0) && categoryId && !this.isUuid(categoryId)) {
        // Convert slug like "food-groceries" to "Food & Groceries" best-effort: replace '-' with ' ', title case
        const spaced = categoryId.replace(/-/g, ' ');
        derivedName = spaced.replace(/\b\w/g, (c) => c.toUpperCase());
      }

      if (derivedName) {
        const { data: created, error: createErr } = await supabaseAdmin
          .from('categories')
          .insert({
            user_id: userId,
            name: derivedName,
            color: '#6B7280',
            icon: 'more-horizontal',
            is_default: false,
          })
          .select('id,name')
          .single();

        if (!createErr && created) {
          return { id: created.id, name: created.name };
        }
      }
    }
    return null;
  }
  /**
   * Get user's monthly goal for current month
   */
  static async getCurrentMonthlyGoal(userId: string): Promise<MonthlyGoal | null> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: goal, error } = await supabaseAdmin
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
      const { data: goal, error } = await supabaseAdmin
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
      
      const { data: transactions, error } = await supabaseAdmin
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
      
      // Resolve category id to a valid UUID from categories table (supports default slugs)
      const resolved = await this.resolveCategoryId(
        userId,
        transactionData.category_id,
        transactionData.category_name
      );
      console.log('resolved', resolved);
      console.log('transactionData', transactionData);
      if (!resolved) {
        throw createError('Unknown category. Provide a valid category_id or category_name.', 400);
      }

      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          category_id: resolved.id,
          category_name: resolved.name,
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

      return transaction as Transaction;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Create transaction error:', error);
      throw createError('Failed to create transaction', 500);
    }
  }

  /**
   * Update a transaction by id, ensuring it belongs to user. If date changes, update month accordingly.
   */
  static async updateTransaction(userId: string, transactionId: string, updates: Partial<CreateTransactionRequest>): Promise<Transaction> {
    try {
      // Ensure the transaction belongs to the user
      const { data: existing, error: findError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (findError || !existing) {
        throw createError('Transaction not found', 404);
      }

      let month = existing.month as string;
      let newDate = existing.date as string;
      if (updates.date) {
        newDate = updates.date;
        month = new Date(updates.date).toISOString().slice(0, 7);
      }

      // If category change provided and not a valid UUID, resolve by name
      let categoryIdToUse = existing.category_id as string;
      let categoryNameToUse = existing.category_name as string;
      if (updates.category_id || updates.category_name) {
        const resolved = await this.resolveCategoryId(userId, updates.category_id, updates.category_name);
        if (!resolved) {
          throw createError('Unknown category. Provide a valid category_id or category_name.', 400);
        }
        categoryIdToUse = resolved.id;
        categoryNameToUse = resolved.name;
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('transactions')
        .update({
          category_id: categoryIdToUse,
          category_name: categoryNameToUse,
          amount: updates.amount ?? existing.amount,
          description: updates.description ?? existing.description,
          date: newDate,
          month,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw createError('Failed to update transaction', 500);
      }

      return updated as Transaction;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Update transaction error:', error);
      throw createError('Failed to update transaction', 500);
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
      const { data: history, error } = await supabaseAdmin
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
      const { data: categories, error } = await supabaseAdmin
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
      const { data: category, error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
    