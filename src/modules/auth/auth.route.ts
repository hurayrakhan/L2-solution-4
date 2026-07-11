import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', auth(), AuthController.getMe);

export default router;
