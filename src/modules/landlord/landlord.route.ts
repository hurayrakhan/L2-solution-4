import { Router } from 'express';
import { LandlordController } from './landlord.controller.js';
import { RentalController } from '../rental/rental.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createPropertySchema, updatePropertySchema } from '../property/property.validation.js';
import { updateRentalStatusSchema } from '../rental/rental.validation.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/properties', auth('LANDLORD'), validate(createPropertySchema), LandlordController.createProperty);
router.put('/properties/:id', auth('LANDLORD'), validate(updatePropertySchema), LandlordController.updateProperty);
router.delete('/properties/:id', auth('LANDLORD'), LandlordController.deleteProperty);

router.get('/requests', auth('LANDLORD'), RentalController.getLandlordRentalRequests);
router.patch('/requests/:id', auth('LANDLORD'), validate(updateRentalStatusSchema), RentalController.updateRentalRequestStatus);

export default router;
