import { Router } from 'express';
import { createProperty, updateProperty, deleteProperty } from '../controllers/landlord.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPropertySchema, updatePropertySchema } from '../validations/property.validation.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/properties', auth('LANDLORD'), validate(createPropertySchema), createProperty);
router.put('/properties/:id', auth('LANDLORD'), validate(updatePropertySchema), updateProperty);
router.delete('/properties/:id', auth('LANDLORD'), deleteProperty);

export default router;
