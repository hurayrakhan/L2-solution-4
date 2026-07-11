import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createPaymentSessionSchema } from './payment.validation.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/create', auth('TENANT'), validate(createPaymentSessionSchema), PaymentController.createPaymentSession);
router.get('/confirm', PaymentController.confirmPayment);
router.post('/confirm', PaymentController.confirmPayment);
router.get('/', auth(), PaymentController.getUserPaymentHistory);
router.get('/:id', auth(), PaymentController.getPaymentById);

export default router;
