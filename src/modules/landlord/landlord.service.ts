import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { IPropertyCreateInput, IPropertyUpdateInput } from './landlord.interface.js';

const createPropertyInDB = async (landlordId: string, payload: IPropertyCreateInput) => {
  const { title, description, location, price, categoryId, amenities, images } = payload;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return await prisma.property.create({
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
};

const updatePropertyInDB = async (landlordId: string, propertyId: string, payload: IPropertyUpdateInput) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  if (property.landlordId !== landlordId) {
    throw new AppError('Forbidden: You do not own this property', 403);
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  return await prisma.property.update({
    where: { id: propertyId },
    data: payload,
    include: {
      category: true,
    },
  });
};

const deletePropertyFromDB = async (landlordId: string, propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  if (property.landlordId !== landlordId) {
    throw new AppError('Forbidden: You do not own this property', 403);
  }

  await prisma.$transaction([
    prisma.review.deleteMany({ where: { propertyId } }),
    prisma.payment.deleteMany({
      where: {
        rentalRequest: {
          propertyId,
        },
      },
    }),
    prisma.rentalRequest.deleteMany({ where: { propertyId } }),
    prisma.property.delete({ where: { id: propertyId } }),
  ]);

  return true;
};

export const LandlordService = {
  createPropertyInDB,
  updatePropertyInDB,
  deletePropertyFromDB,
};
