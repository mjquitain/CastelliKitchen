import { Router } from 'express';
import passport from '../config/passport.js';
import { googleAuthFailed, googleCallback } from '../controllers/auth.controller.js';

const router = Router();

// Google OAuth routes
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/api/v1/auth/google/failure',
        session: false
    }),
    googleCallback
);

router.get('/google/failure', googleAuthFailed);

export default router;
