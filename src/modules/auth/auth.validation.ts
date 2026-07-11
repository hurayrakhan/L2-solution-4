import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1, 'Name cannot be empty'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['TENANT', 'LANDLORD'], { required_error: 'Role must be either TENANT or LANDLORD' }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});
