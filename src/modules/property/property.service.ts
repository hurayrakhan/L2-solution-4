import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { IPropertyQueryOptions } from './property.interface.js';

const getCategoriesFromDB = async () => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
};

const getAllPropertiesFromDB = async (options: IPropertyQueryOptions) => {
  const { location, minPrice, maxPrice, categoryId, search, amenities } = options;

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

  return properties.map((prop) => {
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
};

const getPropertyByIdFromDB = async (id: string) => {
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
    throw new AppError('Property not found', 404);
  }

  const totalReviews = property.reviews.length;
  const averageRating =
    totalReviews > 0
      ? property.reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews
      : 0;

  return {
    ...property,
    averageRating,
    totalReviews,
  };
};

export const PropertyService = {
  getCategoriesFromDB,
  getAllPropertiesFromDB,
  getPropertyByIdFromDB,
};
