import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'rentnest_jwt_secret_token_change_in_production';
  const expires = (process.env.JWT_EXPIRES_IN || '7d') as any;
  return jwt.sign({ id }, secret, { expiresIn: expires });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.status === 'BANNED') {
      return next(new AppError('Your account has been banned', 403));
    }

    const token = signToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
