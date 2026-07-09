import { z } from 'zod';

export const createPaymentSessionSchema = z.object({
  body: z.object({
    rentalRequestId: z.string({ required_error: 'Rental Request ID is required' }).uuid('Invalid Rental Request ID format'),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    sessionId: z.string().optional(),
    rentalRequestId: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});
