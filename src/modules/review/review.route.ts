import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createReviewSchema } from './review.validation.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/', auth('TENANT'), validate(createReviewSchema), ReviewController.createReview);

export default router;
