import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { RentalService } from './rental.service.js';

const createRentalRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const rentalRequest = await RentalService.createRentalRequestInDB(tenantId, req.body);

    res.status(201).json({
      success: true,
      message: 'Rental request submitted successfully',
      data: rentalRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getUserRentalRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const rentalRequests = await RentalService.getUserRentalRequestsFromDB(userId, role);

    res.status(200).json({
      success: true,
      data: rentalRequests,
    });
  } catch (error) {
    next(error);
  }
};

const getRentalRequestById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;
    const rentalRequest = await RentalService.getRentalRequestByIdFromDB(id!, userId, role);

    res.status(200).json({
      success: true,
      data: rentalRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getLandlordRentalRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const requests = await RentalService.getLandlordRentalRequestsFromDB(landlordId);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

const updateRentalRequestStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;
    const updatedRequest = await RentalService.updateRentalRequestStatusInDB(landlordId, id!, status);

    res.status(200).json({
      success: true,
      message: `Rental request has been ${status.toLowerCase()}`,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const RentalController = {
  createRentalRequest,
  getUserRentalRequests,
  getRentalRequestById,
  getLandlordRentalRequests,
  updateRentalRequestStatus,
};
