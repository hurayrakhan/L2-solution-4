import { Router } from 'express';
import { createProperty, updateProperty, deleteProperty } from '../controllers/landlord.controller.js';
import { getLandlordRentalRequests, updateRentalRequestStatus } from '../controllers/rental.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPropertySchema, updatePropertySchema } from '../validations/property.validation.js';
import { updateRentalStatusSchema } from '../validations/rental.validation.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/properties', auth('LANDLORD'), validate(createPropertySchema), createProperty);
router.put('/properties/:id', auth('LANDLORD'), validate(updatePropertySchema), updateProperty);
router.delete('/properties/:id', auth('LANDLORD'), deleteProperty);

router.get('/requests', auth('LANDLORD'), getLandlordRentalRequests);
router.patch('/requests/:id', auth('LANDLORD'), validate(updateRentalStatusSchema), updateRentalRequestStatus);

export default router;
