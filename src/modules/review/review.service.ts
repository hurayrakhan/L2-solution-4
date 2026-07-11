import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { IReviewCreateInput } from './review.interface.js';

const createReviewInDB = async (tenantId: string, payload: IReviewCreateInput) => {
  const { propertyId, rating, comment } = payload;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
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
    throw new AppError('Forbidden: You can only review properties you have actively rented or completed renting', 400);
  }

  return await prisma.review.create({
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
};

export const ReviewService = {
  createReviewInDB,
};
