import { Request } from 'express';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  user_id?: string;
  created_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  icon: string;
}

// Monthly Goal types
export interface MonthlyGoal {
  id: string;
  user_id: string;
  month: string; // YYYY-MM format
  income: number;
  expenses: CategoryExpense[];
  created_at: string;
  updated_at: string;
}

export interface CategoryExpense {
  category_id: string;
  category_name: string;
  expected_amount: number;
  actual_amount?: number;
}

export interface CreateMonthlyGoalRequest {
  month: string;
  income: number;
  expenses: CategoryExpense[];
}

// Transaction types
export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  amount: number;
  description: string;
  date: string;
  month: string; // YYYY-MM format
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  category_id: string;
  amount: number;
  description: string;
  date: string;
}

// Monthly History types
export interface MonthlyHistory {
  id: string;
  user_id: string;
  month: string;
  goal: MonthlyGoal;
  transactions: Transaction[];
  total_income: number;
  total_expenses: number;
  actual_savings: number;
  finalized_at: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Request with user
export interface AuthenticatedRequest extends Request {
  user?: User;
}
