import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'BANNED'], {
      required_error: 'Status must be either ACTIVE or BANNED',
    }),
  }),
});
