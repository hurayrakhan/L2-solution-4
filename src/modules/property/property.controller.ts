import { Request, Response, NextFunction } from 'express';
import { PropertyService } from './property.service.js';

const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await PropertyService.getCategoriesFromDB();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const getAllProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const properties = await PropertyService.getAllPropertiesFromDB(req.query);

    res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

const getPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await PropertyService.getPropertyByIdFromDB(id!);

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

export const PropertyController = {
  getCategories,
  getAllProperties,
  getPropertyById,
};
