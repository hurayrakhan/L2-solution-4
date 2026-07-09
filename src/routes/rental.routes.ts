import { Router } from 'express';
import { createRentalRequest, getUserRentalRequests, getRentalRequestById } from '../controllers/rental.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRentalRequestSchema } from '../validations/rental.validation.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', auth('TENANT'), validate(createRentalRequestSchema), createRentalRequest);
router.get('/', auth(), getUserRentalRequests);
router.get('/:id', auth(), getRentalRequestById);

export default router;
