import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { PaymentService } from './payment.service.js';

const createPaymentSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { rentalRequestId } = req.body;
    const protocol = req.protocol;
    const host = req.get('host') || 'localhost:5000';

    const result = await PaymentService.createPaymentSessionInDB(tenantId, rentalRequestId, protocol, host);

    res.status(200).json({
      success: true,
      message: 'Payment session created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = (req as any).rawBody;

    const result = await PaymentService.confirmPaymentInDB({
      signature,
      rawBody,
      body: req.body,
      query: req.query,
    });

    if ('received' in result && result.received) {
      res.json({ received: true });
      return;
    }

    if ('success' in result && !result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUserPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const payments = await PaymentService.getUserPaymentHistoryFromDB(userId, role);

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const payment = await PaymentService.getPaymentByIdFromDB(id!, userId, role);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const PaymentController = {
  createPaymentSession,
  confirmPayment,
  getUserPaymentHistory,
  getPaymentById,
};
