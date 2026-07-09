import { Router } from 'express';
import { createReview } from '../controllers/review.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReviewSchema } from '../validations/review.validation.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', auth('TENANT'), validate(createReviewSchema), createReview);

export default router;
