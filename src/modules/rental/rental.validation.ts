import { z } from 'zod';

export const createRentalRequestSchema = z.object({
  body: z.object({
    propertyId: z.string({ required_error: 'Property ID is required' }).uuid('Invalid Property ID format'),
    startDate: z.string({ required_error: 'Start date is required' }).transform((val) => new Date(val)),
    endDate: z.string({ required_error: 'End date is required' }).transform((val) => new Date(val)),
  }).refine((data) => data.startDate < data.endDate, {
    message: 'Start date must be before end date',
    path: ['endDate'],
  }),
});

export const updateRentalStatusSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      required_error: 'Status must be either APPROVED or REJECTED',
    }),
  }),
});
