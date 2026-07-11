import { Response, NextFunction } from 'express';
import { AppError } from '../../utils/app-error.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { AdminService } from './admin.service.js';

const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await AdminService.getAllUsersFromDB();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    if (adminId === id) {
      return next(new AppError('Forbidden: You cannot change your own status', 400));
    }

    const updatedUser = await AdminService.updateUserStatusInDB(id!, status);

    res.status(200).json({
      success: true,
      message: `User account is now ${status.toLowerCase()}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const getAllProperties = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const properties = await AdminService.getAllPropertiesFromDB();

    res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRentalRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await AdminService.getAllRentalRequestsFromDB();

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentalRequests,
};
