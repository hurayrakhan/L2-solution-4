import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map((e) => ({
          field: e.path.slice(1).join('.'), // slice(1) removes 'body', 'query', or 'params'
          message: e.message,
        }));
        next(new AppError('Validation failed', 400, errorDetails));
      } else {
        next(error);
      }
    }
  };
};
