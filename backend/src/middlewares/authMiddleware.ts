import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { isInMemoryMode } from '../config/db';
import { inMemoryUsers } from '../models/inMemoryStore';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

interface JwtPayload {
  userId: string;
}

/**
 * Protect routes requiring authentication via JWT
 */
export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (isInMemoryMode()) {
      const user = inMemoryUsers.find((u) => u._id === decoded.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.',
        });
        return;
      }
      req.user = user as any;
      req.userId = user._id;
      return next();
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};
