import { Router } from 'express';
import { getAllProperties, getPropertyById, getCategories } from '../controllers/property.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getPropertiesQuerySchema } from '../validations/property.validation.js';

const router = Router();

// Define these paths relative to the mount point (e.g. app.use('/api', propertyRouter))
router.get('/properties', validate(getPropertiesQuerySchema), getAllProperties);
router.get('/properties/:id', getPropertyById);
router.get('/categories', getCategories);

export default router;
