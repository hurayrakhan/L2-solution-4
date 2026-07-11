import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateUserStatusSchema } from './admin.validation.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/users', auth('ADMIN'), AdminController.getAllUsers);
router.patch('/users/:id', auth('ADMIN'), validate(updateUserStatusSchema), AdminController.updateUserStatus);
router.get('/properties', auth('ADMIN'), AdminController.getAllProperties);
router.get('/rentals', auth('ADMIN'), AdminController.getAllRentalRequests);

export default router;
