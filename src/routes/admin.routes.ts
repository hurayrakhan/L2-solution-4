import { Router } from 'express';
import { getAllUsers, updateUserStatus, getAllProperties, getAllRentalRequests } from '../controllers/admin.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateUserStatusSchema } from '../validations/admin.validation.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/users', auth('ADMIN'), getAllUsers);
router.patch('/users/:id', auth('ADMIN'), validate(updateUserStatusSchema), updateUserStatus);
router.get('/properties', auth('ADMIN'), getAllProperties);
router.get('/rentals', auth('ADMIN'), getAllRentalRequests);

export default router;
