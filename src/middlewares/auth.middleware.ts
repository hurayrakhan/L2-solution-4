import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role, User } from '@prisma/client';
import { AppError } from '../utils/app-error.js';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: User;
}

export const auth = (...allowedRoles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Unauthorized: No token provided', 401));
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return next(new AppError('Unauthorized: Invalid token format', 401));
      }

      const jwtSecret = process.env.JWT_SECRET || 'rentnest_jwt_secret_token_change_in_production';
      const decoded = jwt.verify(token, jwtSecret) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return next(new AppError('Unauthorized: User not found', 401));
      }

      if (user.status === 'BANNED') {
        return next(new AppError('Forbidden: Your account has been banned', 403));
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return next(new AppError('Forbidden: Access denied', 403));
      }

      req.user = user;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Unauthorized: Token has expired', 401));
      }
      return next(new AppError('Unauthorized: Invalid token', 401));
    }
  };
};
