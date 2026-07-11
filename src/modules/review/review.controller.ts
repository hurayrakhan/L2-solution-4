import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { ReviewService } from './review.service.js';

const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const review = await ReviewService.createReviewInDB(tenantId, req.body);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const ReviewController = {
  createReview,
};
