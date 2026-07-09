import { Router } from 'express';
import { createPaymentSession, confirmPayment, getUserPaymentHistory, getPaymentById } from '../controllers/payment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPaymentSessionSchema } from '../validations/payment.validation.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create', auth('TENANT'), validate(createPaymentSessionSchema), createPaymentSession);
router.get('/confirm', confirmPayment);
router.post('/confirm', confirmPayment);
router.get('/', auth(), getUserPaymentHistory);
router.get('/:id', auth(), getPaymentById);

export default router;
