import { z } from 'zod';

export const getPropertiesQuerySchema = z.object({
  query: z.object({
    location: z.string().optional(),
    minPrice: z.string().transform((val) => (val ? parseFloat(val) : undefined)).optional(),
    maxPrice: z.string().transform((val) => (val ? parseFloat(val) : undefined)).optional(),
    categoryId: z.string().uuid('Invalid Category ID format').optional(),
    search: z.string().optional(),
    amenities: z.union([z.string(), z.array(z.string())]).optional(),
  }),
});

export const createPropertySchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1, 'Title cannot be empty'),
    description: z.string({ required_error: 'Description is required' }).min(1, 'Description cannot be empty'),
    location: z.string({ required_error: 'Location is required' }).min(1, 'Location cannot be empty'),
    price: z.number({ required_error: 'Price is required' }).positive('Price must be a positive number'),
    categoryId: z.string({ required_error: 'Category ID is required' }).uuid('Invalid Category ID format'),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
  }),
});

export const updatePropertySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    location: z.string().min(1, 'Location cannot be empty').optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    categoryId: z.string().uuid('Invalid Category ID format').optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    availability: z.boolean().optional(),
  }),
});
