import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { AuthService } from './auth.service.js';
import { AppError } from '../../utils/app-error.js';

const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await AuthService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AuthService.loginUser(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const user = await AuthService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  register,
  login,
  getMe,
};
