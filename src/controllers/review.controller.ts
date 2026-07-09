import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, rating, comment } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return next(new AppError('Property not found', 404));
    }

    const rental = await prisma.rentalRequest.findFirst({
      where: {
        tenantId,
        propertyId,
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
      },
    });

    if (!rental) {
      return next(
        new AppError('Forbidden: You can only review properties you have actively rented or completed renting', 400)
      );
    }

    const review = await prisma.review.create({
      data: {
        propertyId,
        tenantId,
        rating,
        comment,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
