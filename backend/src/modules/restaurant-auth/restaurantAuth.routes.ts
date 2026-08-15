import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validate';
import { restaurantLogin } from './restaurantAuth.controller';

const router = Router();

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  restaurantLogin
);

export { router as restaurantAuthRoutes };
