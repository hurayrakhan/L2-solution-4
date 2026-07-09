import { Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    if (adminId === id) {
      return next(new AppError('Forbidden: You cannot change your own status', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status,
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

    res.status(200).json({
      success: true,
      message: `User account is now ${status.toLowerCase()}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllProperties = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        category: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRentalRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await prisma.rentalRequest.findMany({
      include: {
        property: {
          include: {
            category: true,
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};
