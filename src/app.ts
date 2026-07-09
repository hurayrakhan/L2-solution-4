import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { AppError } from './utils/app-error.js';

import authRouter from './routes/auth.routes.js';
import propertyRouter from './routes/property.routes.js';
import landlordRouter from './routes/landlord.routes.js';
import rentalRouter from './routes/rental.routes.js';
import paymentRouter from './routes/payment.routes.js';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base API route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the RentNest API 🏠',
  });
});

// We will mount routes here later
app.use('/api/auth', authRouter);
app.use('/api', propertyRouter);
app.use('/api/landlord', landlordRouter);
app.use('/api/rentals', rentalRouter);
app.use('/api/payments', paymentRouter);

// 404 handler for routes not found
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
