import { Router } from 'express';
import { RentalController } from './rental.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createRentalRequestSchema } from './rental.validation.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/', auth('TENANT'), validate(createRentalRequestSchema), RentalController.createRentalRequest);
router.get('/', auth(), RentalController.getUserRentalRequests);
router.get('/:id', auth(), RentalController.getRentalRequestById);

export default router;
