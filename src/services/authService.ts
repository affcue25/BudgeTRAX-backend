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
   * Sign up a new user using Supabase Auth and return Supabase access token
   */
  static async signup(userData: CreateUserRequest): Promise<AuthResponse> {
    try {
      const { email, password, name } = userData;

      // Create Supabase Auth user (server-side, confirmed immediately)
      const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name: name.trim() },
      });

      if (createUserError || !createdUser?.user) {
        throw createError(createUserError?.message || 'Failed to create auth user', 500);
      }

      const authUser = createdUser.user;

      // Ensure a corresponding row exists in our users table, keyed by auth user id
      const { data: dbUser, error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email?.toLowerCase(),
          // The application no longer uses this column for auth; keep non-null to satisfy schema
          password: '',
          name: name.trim(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

      if (upsertError || !dbUser) {
        throw createError('Failed to create application user', 500);
      }

      // Sign in to get a Supabase session access token
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError || !signInData?.session?.access_token) {
        throw createError('Failed to sign in after signup', 500);
      }

      const token = signInData.session.access_token;

      const { password: _pw, ...userWithoutPassword } = dbUser;

      return {
        user: userWithoutPassword as User,
        token,
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

      // Authenticate via Supabase Auth to get access token
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError || !signInData?.session?.access_token || !signInData.user) {
        throw createError('Invalid email or password', 401);
      }

      const accessToken = signInData.session.access_token;
      const authUserId = signInData.user.id;

      // Get corresponding app user row
      const { data: appUser, error: appUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .eq('is_active', true)
        .single();

      if (appUserError || !appUser) {
        throw createError('User not found', 404);
      }

      const { password: _pw, ...userWithoutPassword } = appUser;

      return {
        user: userWithoutPassword as User,
        token: accessToken,
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
      // Validate using Supabase Auth
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        throw createError('Invalid token', 401);
      }

      const authUserId = data.user.id;
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        throw createError('User not found', 404);
      }

      const { password: _pw, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw error as Error;
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
      const { data: user, error } = await supabaseAdmin
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
      const { error: updateError } = await supabaseAdmin
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
