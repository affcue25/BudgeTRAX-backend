import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/database';
import { JWTPayload, AuthenticatedRequest } from '../types';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    // Prefer Supabase token validation
    const { data, error: supaError } = await supabase.auth.getUser(token);
    if (supaError || !data?.user) {
      // fallback to legacy custom JWT if present
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        res.status(401).json({ success: false, error: 'Invalid token or user not found' });
        return;
      }

      (req as any).user = user;
      next();
      return;
    }

    // Supabase token path
    const authUserId = data.user.id;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid token or user not found' });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
