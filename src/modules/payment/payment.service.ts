import Stripe from 'stripe';
import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { PaymentStatus, Role } from '@prisma/client';

const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
  return new Stripe(secretKey);
};

const createPaymentSessionInDB = async (tenantId: string, rentalRequestId: string, protocol: string, host: string) => {
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: {
      property: true,
    },
  });

  if (!rentalRequest) {
    throw new AppError('Rental request not found', 404);
  }

  if (rentalRequest.tenantId !== tenantId) {
    throw new AppError('Forbidden: You do not own this rental request', 403);
  }

  if (rentalRequest.status !== 'APPROVED' && rentalRequest.status !== 'PAYMENT') {
    throw new AppError('Payment can only be created for approved rental requests', 400);
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
        success_url: `${protocol}://${host}/api/payments/confirm?session_id={CHECKOUT_SESSION_ID}&rentalRequestId=${rentalRequest.id}`,
        cancel_url: `${protocol}://${host}/api/payments/cancel`,
        metadata: {
          rentalRequestId: rentalRequest.id,
          tenantId,
        },
      });
      sessionUrl = session.url || '';
      sessionId = session.id;
    } catch (err: any) {
      console.error('Stripe session creation failed, falling back to simulation:', err.message);
      sessionUrl = `${protocol}://${host}/api/payments/confirm?rentalRequestId=${rentalRequest.id}&transactionId=sim_${Date.now()}`;
    }
  } else {
    sessionUrl = `${protocol}://${host}/api/payments/confirm?rentalRequestId=${rentalRequest.id}&transactionId=sim_${Date.now()}`;
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

  return {
    sessionId,
    paymentUrl: sessionUrl,
    paymentId: payment.id,
    amount: rentalRequest.totalPrice,
  };
};

const confirmPaymentInDB = async (payload: {
  signature?: string | string[];
  rawBody?: any;
  body: any;
  query: any;
}) => {
  const { signature, rawBody, body, query } = payload;
  let rentalRequestId: string | undefined;
  let transactionId: string | undefined;
  let method = 'card';
  let status: 'COMPLETED' | 'FAILED' = 'COMPLETED';

  if (signature) {
    const stripe = getStripeInstance();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody || JSON.stringify(body),
        String(signature),
        webhookSecret
      );
    } catch (err: any) {
      throw new AppError(`Webhook Error: ${err.message}`, 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      rentalRequestId = session.metadata?.rentalRequestId;
      transactionId = session.id;
    } else {
      return { received: true };
    }
  }

  if (!rentalRequestId) {
    const sessionIdQuery = query.session_id || body.sessionId;
    const rentalRequestIdQuery = query.rentalRequestId || body.rentalRequestId;
    const transIdQuery = query.transactionId || body.transactionId;

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
          throw new AppError('Stripe verification failed and no fallback provided', 400);
        }
      }
    } else if (rentalRequestIdQuery && transIdQuery) {
      rentalRequestId = String(rentalRequestIdQuery);
      transactionId = String(transIdQuery);
    }
  }

  if (!rentalRequestId || !transactionId) {
    throw new AppError('Missing rental request ID or transaction ID', 400);
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
  });

  if (!rentalRequest) {
    throw new AppError('Rental request not found', 404);
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

    return {
      success: true,
      message: 'Payment confirmed successfully. Rental request is now ACTIVE.',
      data: {
        rentalRequestId,
        transactionId,
        status: 'ACTIVE',
      },
    };
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

    return {
      success: false,
      message: 'Payment failed.',
      data: {
        rentalRequestId,
        transactionId,
        status: 'FAILED',
      },
    };
  }
};

const getUserPaymentHistoryFromDB = async (userId: string, role: Role) => {
  if (role === 'TENANT') {
    return await prisma.payment.findMany({
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
    return await prisma.payment.findMany({
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
    return await prisma.payment.findMany({
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
};

const getPaymentByIdFromDB = async (id: string, userId: string, role: Role) => {
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
    throw new AppError('Payment record not found', 404);
  }

  const isTenant = payment.rentalRequest.tenantId === userId;
  const isLandlord = payment.rentalRequest.property.landlordId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isTenant && !isLandlord && !isAdmin) {
    throw new AppError('Forbidden: Access denied', 403);
  }

  return payment;
};

export const PaymentService = {
  createPaymentSessionInDB,
  confirmPaymentInDB,
  getUserPaymentHistoryFromDB,
  getPaymentByIdFromDB,
};
