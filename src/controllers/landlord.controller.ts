import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

export const createProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const { title, description, location, price, categoryId, amenities, images } = req.body;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        location,
        price,
        categoryId,
        amenities,
        images,
        landlordId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const { id } = req.params;
    const { title, description, location, price, categoryId, amenities, images, availability } = req.body;

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return next(new AppError('Property not found', 404));
    }

    if (property.landlordId !== landlordId) {
      return next(new AppError('Forbidden: You do not own this property', 403));
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return next(new AppError('Category not found', 404));
      }
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        title,
        description,
        location,
        price,
        categoryId,
        amenities,
        images,
        availability,
      },
      include: {
        category: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return next(new AppError('Property not found', 404));
    }

    if (property.landlordId !== landlordId) {
      return next(new AppError('Forbidden: You do not own this property', 403));
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { propertyId: id } }),
      prisma.payment.deleteMany({
        where: {
          rentalRequest: {
            propertyId: id,
          },
        },
      }),
      prisma.rentalRequest.deleteMany({ where: { propertyId: id } }),
      prisma.property.delete({ where: { id } }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
