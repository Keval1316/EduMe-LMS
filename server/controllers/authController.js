const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/email');
const crypto = require('crypto');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    // Allow override via env; default to 'lax' in dev, 'none' in prod if cross-site is needed
    const sameSite = process.env.COOKIE_SAME_SITE || (isProd ? 'none' : 'lax');
    const secure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd;
    return {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
};

const register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user
        const user = new User({
            fullName,
            email,
            password,
            role,
            verificationCode,
            verificationCodeExpires
        });

        await user.save();

        // Send verification email
        await sendVerificationEmail(email, verificationCode);

        res.status(201).json({
            message: 'User registered successfully. Please check your email for verification code.',
            userId: user._id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { userId, verificationCode } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'Invalid user' });
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        if (user.verificationCodeExpires < new Date()) {
            return res.status(400).json({ message: 'Verification code expired' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        // Set cookie with secure options
        res.cookie('token', token, getCookieOptions());

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                interests: user.interests
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const logout = (req, res) => {
    const opts = getCookieOptions();
    res.clearCookie('token', { httpOnly: true, secure: opts.secure, sameSite: opts.sameSite });
    res.json({ message: 'Logged out successfully' });
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateInterests = async (req, res) => {
    try {
        const { interests } = req.body;

        await User.findByIdAndUpdate(req.user.id, { interests });

        res.json({ message: 'Interests updated successfully' });
    } catch (error) {
        console.error('Update interests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update basic profile details (e.g., fullName, avatar URL)
const updateProfile = async (req, res) => {
    try {
        const { fullName, avatar } = req.body;

        const toUpdate = {};
        if (typeof fullName === 'string' && fullName.trim().length >= 2) {
            toUpdate.fullName = fullName.trim();
        }
        if (typeof avatar === 'string') {
            toUpdate.avatar = avatar;
        }

        if (Object.keys(toUpdate).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const updated = await User.findByIdAndUpdate(
            req.user.id,
            { $set: toUpdate },
            { new: true, runValidators: true, select: '-password' }
        );

        if (!updated) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user: updated });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change password with current password verification
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword || '');
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword; // will be hashed by pre-save hook
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    verifyEmail,
    login,
    logout,
    getProfile,
    updateInterests,
    updateProfile,
    changePassword
};