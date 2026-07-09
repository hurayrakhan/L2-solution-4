import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

export const createRentalRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, startDate, endDate } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return next(new AppError('Property not found', 404));
    }

    if (!property.availability) {
      return next(new AppError('Property is not available for rent', 400));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return next(new AppError('End date must be after start date', 400));
    }

    const totalPrice = diffDays * property.price;

    const rentalRequest = await prisma.rentalRequest.create({
      data: {
        propertyId,
        tenantId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: 'PENDING',
      },
      include: {
        property: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Rental request submitted successfully',
      data: rentalRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRentalRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let rentalRequests;

    if (role === 'TENANT') {
      rentalRequests = await prisma.rentalRequest.findMany({
        where: { tenantId: userId },
        include: {
          property: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'LANDLORD') {
      rentalRequests = await prisma.rentalRequest.findMany({
        where: {
          property: {
            landlordId: userId,
          },
        },
        include: {
          property: {
            include: {
              category: true,
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
    } else {
      rentalRequests = await prisma.rentalRequest.findMany({
        include: {
          property: true,
          tenant: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json({
      success: true,
      data: rentalRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const getRentalRequestById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id },
      include: {
        property: {
          include: {
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
    });

    if (!rentalRequest) {
      return next(new AppError('Rental request not found', 404));
    }

    const isTenant = rentalRequest.tenantId === userId;
    const isLandlord = rentalRequest.property.landlordId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isTenant && !isLandlord && !isAdmin) {
      return next(new AppError('Forbidden: Access denied', 403));
    }

    res.status(200).json({
      success: true,
      data: rentalRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getLandlordRentalRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;

    const requests = await prisma.rentalRequest.findMany({
      where: {
        property: {
          landlordId,
        },
      },
      include: {
        property: {
          include: {
            category: true,
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

export const updateRentalRequestStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!rentalRequest) {
      return next(new AppError('Rental request not found', 404));
    }

    if (rentalRequest.property.landlordId !== landlordId) {
      return next(new AppError('Forbidden: You do not own the property for this request', 403));
    }

    if (rentalRequest.status !== 'PENDING') {
      return next(new AppError('Only pending requests can be approved or rejected', 400));
    }

    const updatedRequest = await prisma.rentalRequest.update({
      where: { id },
      data: {
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: `Rental request has been ${status.toLowerCase()}`,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};
