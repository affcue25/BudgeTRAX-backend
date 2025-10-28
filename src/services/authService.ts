import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/database';
import { CreateUserRequest, LoginRequest, AuthResponse, User } from '../types';
import { createError } from '../middleware/errorHandler';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  private static validateJWTSecret(): string {
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return this.JWT_SECRET;
  }

  /**
   * Sign up a new user
   */
  static async signup(userData: CreateUserRequest): Promise<AuthResponse> {
    try {
      const { email, password, name } = userData;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        throw createError('User with this email already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create user in database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name.trim(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error during signup:', error);
        throw createError('Failed to create user', 500);
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      // Generate JWT token
      const token = this.generateToken(newUser.id, newUser.email);

      return {
        user: userWithoutPassword as User,
        token
      };
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Signup error:', error);
      throw createError('Signup failed', 500);
    }
  }

  /**
   * Sign in an existing user
   */
  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = loginData;

      // Find user by email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error || !user) {
        throw createError('Invalid email or password', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw createError('Invalid email or password', 401);
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Generate JWT token
      const token = this.generateToken(user.id, user.email);

      return {
        user: userWithoutPassword as User,
        token
      };
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Login error:', error);
      throw createError('Login failed', 500);
    }
  }

  /**
   * Verify JWT token and get user
   */
  static async verifyToken(token: string): Promise<User> {
    try {
      const secret = this.validateJWTSecret();
      const decoded = jwt.verify(token, secret) as { userId: string; email: string };
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        throw createError('Invalid token', 401);
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid token', 401);
      }
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(userId: string, email: string): string {
    const secret = this.validateJWTSecret();
    return jwt.sign(
      { userId, email },
      secret,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user with password
      const { data: user, error } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw createError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 400);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw createError('Failed to update password', 500);
      }
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      console.error('Change password error:', error);
      throw createError('Failed to change password', 500);
    }
  }
}
