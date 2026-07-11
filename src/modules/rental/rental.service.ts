import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { RentalRequestStatus, Role } from '@prisma/client';
import { IRentalCreateInput } from './rental.interface.js';

const createRentalRequestInDB = async (tenantId: string, payload: IRentalCreateInput) => {
  const { propertyId, startDate, endDate } = payload;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  if (!property.availability) {
    throw new AppError('Property is not available for rent', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    throw new AppError('End date must be after start date', 400);
  }

  const totalPrice = diffDays * property.price;

  return await prisma.rentalRequest.create({
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
};

const getUserRentalRequestsFromDB = async (userId: string, role: Role) => {
  if (role === 'TENANT') {
    return await prisma.rentalRequest.findMany({
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
    return await prisma.rentalRequest.findMany({
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
    return await prisma.rentalRequest.findMany({
      include: {
        property: true,
        tenant: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
};

const getRentalRequestByIdFromDB = async (id: string, userId: string, role: Role) => {
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
    throw new AppError('Rental request not found', 404);
  }

  const isTenant = rentalRequest.tenantId === userId;
  const isLandlord = rentalRequest.property.landlordId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isTenant && !isLandlord && !isAdmin) {
    throw new AppError('Forbidden: Access denied', 403);
  }

  return rentalRequest;
};

const getLandlordRentalRequestsFromDB = async (landlordId: string) => {
  return await prisma.rentalRequest.findMany({
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
};

const updateRentalRequestStatusInDB = async (landlordId: string, id: string, status: RentalRequestStatus) => {
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id },
    include: {
      property: true,
    },
  });

  if (!rentalRequest) {
    throw new AppError('Rental request not found', 404);
  }

  if (rentalRequest.property.landlordId !== landlordId) {
    throw new AppError('Forbidden: You do not own the property for this request', 403);
  }

  if (rentalRequest.status !== 'PENDING') {
    throw new AppError('Only pending requests can be approved or rejected', 400);
  }

  return await prisma.rentalRequest.update({
    where: { id },
    data: {
      status,
    },
  });
};

export const RentalService = {
  createRentalRequestInDB,
  getUserRentalRequestsFromDB,
  getRentalRequestByIdFromDB,
  getLandlordRentalRequestsFromDB,
  updateRentalRequestStatusInDB,
};
