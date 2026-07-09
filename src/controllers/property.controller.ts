import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import { prisma } from '../utils/prisma.js';

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { location, minPrice, maxPrice, categoryId, search, amenities } = req.query as any;

    const whereClause: any = {
      availability: true, // Only available properties are public
    };

    if (location) {
      whereClause.location = {
        contains: String(location),
        mode: 'insensitive',
      };
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) {
        whereClause.price.gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        whereClause.price.lte = parseFloat(maxPrice);
      }
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { location: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? (amenities as string[])
        : String(amenities).split(',').map((a) => a.trim());

      whereClause.amenities = {
        hasEvery: amenitiesList,
      };
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        category: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const propertiesWithRatings = properties.map((prop) => {
      const totalReviews = prop.reviews.length;
      const averageRating =
        totalReviews > 0
          ? prop.reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews
          : 0;

      return {
        ...prop,
        averageRating,
        totalReviews,
        reviews: undefined, // Hide nested reviews array in bulk listings for performance
      };
    });

    res.status(200).json({
      success: true,
      data: propertiesWithRatings,
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        category: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) {
      return next(new AppError('Property not found', 404));
    }

    const totalReviews = property.reviews.length;
    const averageRating =
      totalReviews > 0
        ? property.reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews
        : 0;

    res.status(200).json({
      success: true,
      data: {
        ...property,
        averageRating,
        totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};
