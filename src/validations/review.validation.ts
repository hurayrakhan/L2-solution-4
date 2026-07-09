import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    propertyId: z.string({ required_error: 'Property ID is required' }).uuid('Invalid Property ID format'),
    rating: z.number({ required_error: 'Rating is required' }).int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string({ required_error: 'Comment is required' }).min(1, 'Comment cannot be empty'),
  }),
});
