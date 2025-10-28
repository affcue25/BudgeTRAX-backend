import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { CreateUserRequest, LoginRequest, ApiResponse } from '../types';
import { createError } from '../middleware/errorHandler';

export class AuthController {
  /**
   * Sign up a new user
   */
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      
      const result = await AuthService.signup(userData);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'User created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sign in an existing user
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      
      const result = await AuthService.login(loginData);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Login successful'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw createError('User not found', 404);
      }
      
      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Profile retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;
      
      if (!user) {
        throw createError('User not found', 404);
      }
      
      if (!currentPassword || !newPassword) {
        throw createError('Current password and new password are required', 400);
      }
      
      if (newPassword.length < 6) {
        throw createError('New password must be at least 6 characters long', 400);
      }
      
      await AuthService.changePassword(user.id, currentPassword, newPassword);
      
      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: ApiResponse = {
        success: true,
        message: 'Logout successful'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
