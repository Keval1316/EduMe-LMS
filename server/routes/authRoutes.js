const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

const {
    register,
    verifyEmail,
    login,
    logout,
    getProfile,
    updateInterests,
    updateProfile,
    changePassword
} = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// Register
router.post('/register', [
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['Student', 'Instructor']).withMessage('Role must be Student or Instructor')
], validate, register);

// Verify email
router.post('/verify-email', [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
], validate, verifyEmail);

// Login
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], validate, login);

// Logout
router.post('/logout', logout);

// Get profile
router.get('/profile', auth, getProfile);

// Update interests
router.put('/interests', auth, [
    body('interests').isArray().withMessage('Interests must be an array')
], validate, updateInterests);

// Update profile (fullName, avatar)
router.put('/profile', auth, [
    body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('avatar').optional().isString().withMessage('Avatar must be a string URL')
], validate, updateProfile);

// Change password
router.put('/change-password', auth, [
    body('currentPassword').isString().isLength({ min: 6 }).withMessage('Current password is required'),
    body('newPassword').isString().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, changePassword);

module.exports = router;