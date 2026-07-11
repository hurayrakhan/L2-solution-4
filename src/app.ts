import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { AppError } from './utils/app-error.js';

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";


import authRouter from './modules/auth/auth.route.js';
import propertyRouter from './modules/property/property.route.js';
import landlordRouter from './modules/landlord/landlord.route.js';
import rentalRouter from './modules/rental/rental.route.js';
import paymentRouter from './modules/payment/payment.route.js';
import reviewRouter from './modules/review/review.route.js';
import adminRouter from './modules/admin/admin.route.js';

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

// swagger api-docs
const swaggerOptions = {
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.js"
  ]
};

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerOptions)
);

// We will mount routes here later
app.use('/api/auth', authRouter);
app.use('/api', propertyRouter);
app.use('/api/landlord', landlordRouter);
app.use('/api/rentals', rentalRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/admin', adminRouter);

// 404 handler for routes not found
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
