import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { isInMemoryMode } from '../config/db';
import { inMemoryUsers, InMemoryUser } from '../models/inMemoryStore';

/**
 * Generates a signed JWT for a user
 */
const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
  return jwt.sign({ userId }, secret, { expiresIn });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fallback if MongoDB is offline
    if (isInMemoryMode()) {
      const existing = inMemoryUsers.find((u) => u.email === normalizedEmail);
      if (existing) {
        res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser: InMemoryUser = {
        _id: 'user_' + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date(),
      };
      inMemoryUsers.push(newUser);
      const token = signToken(newUser._id);
      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      });
      return;
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = signToken(newUser._id.toString());

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Log in with email and password
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fallback if MongoDB is offline
    if (isInMemoryMode()) {
      const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
        });
        return;
      }

      const token = signToken(user._id);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
      return;
    }

    // Find user by email in MongoDB
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const token = signToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user && !req.userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user?._id || req.userId,
        name: req.user?.name,
        email: req.user?.email,
        createdAt: req.user?.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
