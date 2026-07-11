import { Router } from 'express';
import { PropertyController } from './property.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { getPropertiesQuerySchema } from './property.validation.js';

const router = Router();

router.get('/properties', validate(getPropertiesQuerySchema), PropertyController.getAllProperties);
router.get('/properties/:id', PropertyController.getPropertyById);
router.get('/categories', PropertyController.getCategories);

export default router;
