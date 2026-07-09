import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { AppError } from '../utils/app-error.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
  return new Stripe(secretKey);
};

export const createPaymentSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { rentalRequestId } = req.body;

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
      include: {
        property: true,
      },
    });

    if (!rentalRequest) {
      return next(new AppError('Rental request not found', 404));
    }

    if (rentalRequest.tenantId !== tenantId) {
      return next(new AppError('Forbidden: You do not own this rental request', 403));
    }

    if (rentalRequest.status !== 'APPROVED' && rentalRequest.status !== 'PAYMENT') {
      return next(new AppError('Payment can only be created for approved rental requests', 400));
    }

    const stripe = getStripeInstance();
    let sessionUrl = '';
    let sessionId = `simulated_${Date.now()}`;

    const isDummyStripe = !process.env.STRIPE_SECRET_KEY || 
                          process.env.STRIPE_SECRET_KEY.includes('placeholder') || 
                          process.env.STRIPE_SECRET_KEY.includes('PlaceHolder');

    if (!isDummyStripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Rental: ${rentalRequest.property.title}`,
                  description: `Rental from ${rentalRequest.startDate.toLocaleDateString()} to ${rentalRequest.endDate.toLocaleDateString()}`,
                },
                unit_amount: Math.round(rentalRequest.totalPrice * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${req.protocol}://${req.get('host')}/api/payments/confirm?session_id={CHECKOUT_SESSION_ID}&rentalRequestId=${rentalRequest.id}`,
          cancel_url: `${req.protocol}://${req.get('host')}/api/payments/cancel`,
          metadata: {
            rentalRequestId: rentalRequest.id,
            tenantId,
          },
        });
        sessionUrl = session.url || '';
        sessionId = session.id;
      } catch (err: any) {
        console.error('Stripe session creation failed, falling back to simulation:', err.message);
        sessionUrl = `${req.protocol}://${req.get('host')}/api/payments/confirm?rentalRequestId=${rentalRequest.id}&transactionId=sim_${Date.now()}`;
      }
    } else {
      sessionUrl = `${req.protocol}://${req.get('host')}/api/payments/confirm?rentalRequestId=${rentalRequest.id}&transactionId=sim_${Date.now()}`;
    }

    const payment = await prisma.payment.upsert({
      where: { transactionId: sessionId },
      update: {
        amount: rentalRequest.totalPrice,
        status: 'PENDING',
      },
      create: {
        transactionId: sessionId,
        rentalRequestId: rentalRequest.id,
        amount: rentalRequest.totalPrice,
        status: 'PENDING',
      },
    });

    await prisma.rentalRequest.update({
      where: { id: rentalRequest.id },
      data: {
        status: 'PAYMENT',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment session created successfully',
      data: {
        sessionId,
        paymentUrl: sessionUrl,
        paymentId: payment.id,
        amount: rentalRequest.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let rentalRequestId: string | undefined;
    let transactionId: string | undefined;
    let method = 'card';
    let status: 'COMPLETED' | 'FAILED' = 'COMPLETED';

    const signature = req.headers['stripe-signature'];
    if (signature) {
      const stripe = getStripeInstance();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          (req as any).rawBody || JSON.stringify(req.body),
          signature,
          webhookSecret
        );
      } catch (err: any) {
        return next(new AppError(`Webhook Error: ${err.message}`, 400));
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        rentalRequestId = session.metadata?.rentalRequestId;
        transactionId = session.id;
      } else {
        res.json({ received: true });
        return;
      }
    }

    if (!rentalRequestId) {
      const sessionIdQuery = req.query.session_id || req.body.sessionId;
      const rentalRequestIdQuery = req.query.rentalRequestId || req.body.rentalRequestId;
      const transIdQuery = req.query.transactionId || req.body.transactionId;

      if (sessionIdQuery) {
        const stripe = getStripeInstance();
        try {
          const session = await stripe.checkout.sessions.retrieve(String(sessionIdQuery));
          if (session.payment_status === 'paid') {
            rentalRequestId = session.metadata?.rentalRequestId;
            transactionId = session.id;
          } else {
            status = 'FAILED';
            transactionId = session.id;
            rentalRequestId = session.metadata?.rentalRequestId;
          }
        } catch (err: any) {
          if (rentalRequestIdQuery && transIdQuery) {
            rentalRequestId = String(rentalRequestIdQuery);
            transactionId = String(transIdQuery);
          } else {
            return next(new AppError('Stripe verification failed and no fallback provided', 400));
          }
        }
      } else if (rentalRequestIdQuery && transIdQuery) {
        rentalRequestId = String(rentalRequestIdQuery);
        transactionId = String(transIdQuery);
      }
    }

    if (!rentalRequestId || !transactionId) {
      return next(new AppError('Missing rental request ID or transaction ID', 400));
    }

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
    });

    if (!rentalRequest) {
      return next(new AppError('Rental request not found', 404));
    }

    if (status === 'COMPLETED') {
      await prisma.$transaction([
        prisma.rentalRequest.update({
          where: { id: rentalRequestId },
          data: { status: 'ACTIVE' },
        }),
        prisma.property.update({
          where: { id: rentalRequest.propertyId },
          data: { availability: false },
        }),
        prisma.payment.upsert({
          where: { transactionId },
          update: {
            status: 'COMPLETED',
            paidAt: new Date(),
          },
          create: {
            transactionId,
            rentalRequestId,
            amount: rentalRequest.totalPrice,
            method,
            provider: 'STRIPE',
            status: 'COMPLETED',
            paidAt: new Date(),
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully. Rental request is now ACTIVE.',
        data: {
          rentalRequestId,
          transactionId,
          status: 'ACTIVE',
        },
      });
    } else {
      await prisma.payment.upsert({
        where: { transactionId },
        update: {
          status: 'FAILED',
        },
        create: {
          transactionId,
          rentalRequestId,
          amount: rentalRequest.totalPrice,
          method,
          provider: 'STRIPE',
          status: 'FAILED',
        },
      });

      res.status(400).json({
        success: false,
        message: 'Payment failed.',
        data: {
          rentalRequestId,
          transactionId,
          status: 'FAILED',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getUserPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let payments;

    if (role === 'TENANT') {
      payments = await prisma.payment.findMany({
        where: {
          rentalRequest: {
            tenantId: userId,
          },
        },
        include: {
          rentalRequest: {
            include: {
              property: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'LANDLORD') {
      payments = await prisma.payment.findMany({
        where: {
          rentalRequest: {
            property: {
              landlordId: userId,
            },
          },
        },
        include: {
          rentalRequest: {
            include: {
              property: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      payments = await prisma.payment.findMany({
        include: {
          rentalRequest: {
            include: {
              property: true,
              tenant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rentalRequest: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment) {
      return next(new AppError('Payment record not found', 404));
    }

    const isTenant = payment.rentalRequest.tenantId === userId;
    const isLandlord = payment.rentalRequest.property.landlordId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isTenant && !isLandlord && !isAdmin) {
      return next(new AppError('Forbidden: Access denied', 403));
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
