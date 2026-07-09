import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import { Prisma } from '@prisma/client';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = err.errorDetails || null;

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate key error';
      errorDetails = {
        target: err.meta?.target,
        message: 'A record with this field already exists.',
      };
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
      errorDetails = {
        message: err.meta?.cause || 'The requested record could not be found.',
      };
    } else {
      statusCode = 400;
      message = 'Database query error';
      errorDetails = {
        code: err.code,
        meta: err.meta,
      };
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};
