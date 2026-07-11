import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { LandlordService } from './landlord.service.js';

const createProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const property = await LandlordService.createPropertyInDB(landlordId, req.body);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const { id } = req.params;
    const updatedProperty = await LandlordService.updatePropertyInDB(landlordId, id!, req.body);

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const { id } = req.params;
    await LandlordService.deletePropertyFromDB(landlordId, id!);

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const LandlordController = {
  createProperty,
  updateProperty,
  deleteProperty,
};
