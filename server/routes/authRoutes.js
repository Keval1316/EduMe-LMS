import express from 'express';
import {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword,
    logout
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout); // Even if client-side, good practice to have an endpoint

// Example of a protected route
router.get('/dashboard', protect, (req, res) => {
    res.status(200).json({ message: `Welcome ${req.user.name}`, user: req.user });
});

export default router;
