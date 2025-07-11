import User from "../models/User.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/emailSender.js";
import crypto from "crypto";

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// 1. User Registration
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        console.log("📥 Incoming Registration:", req.body);

        // Validate all fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        // Check if role is valid
        const validRoles = ['student', 'instructor'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role provided.' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Generate verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();

        // Create user
        const newUser = await User.create({
            name,
            email,
            password,
            role,
            verificationCode,
        });

        // Send verification email
        const message = `Your email verification code is: ${verificationCode}. It is valid for 10 minutes.`;

        await sendEmail({
            email: newUser.email,
            subject: 'EduMe - Email Verification',
            message,
        });

        // Respond success
        res.status(201).json({
            message: `Verification code sent to ${newUser.email}. Please verify your account.`,
        });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({
            message: 'Server error during registration.',
            error: error.message,
        });
    }
};


// 2. Email Verification
export const verifyEmail = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            return res
                .status(400)
                .json({ message: "Email and verification code are required." });
        }

        const user = await User.findOne({ email, verificationCode }).select(
            "+verificationCode"
        );

        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid verification code or email." });
        }

        user.isVerified = true;
        user.verificationCode = undefined; // Clear the code
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            message: "Email verified successfully.",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error during email verification.",
            error: error.message,
        });
    }
};

// 3. User Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Please provide email and password." });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return res
                .status(401)
                .json({ message: "Incorrect email or password." });
        }

        if (!user.isVerified) {
            return res
                .status(403)
                .json({
                    message:
                        "Account not verified. Please verify your email first.",
                });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            message: "Logged in successfully.",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error during login.",
            error: error.message,
        });
    }
};

// 4. Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res
                .status(404)
                .json({ message: "No user found with that email address." });
        }

        const resetCode = crypto.randomInt(100000, 999999).toString();

        user.resetCode = resetCode;
        user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        const message = `Your password reset code is: ${resetCode}. It is valid for 10 minutes.`;
        await sendEmail({
            email: user.email,
            subject: "LMS - Password Reset Code",
            message,
        });

        res.status(200).json({
            message: "Password reset code sent to your email.",
        });
    } catch (error) {
        // In case of error, clear reset fields to be safe
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            user.resetCode = undefined;
            user.resetCodeExpires = undefined;
            await user.save({ validateBeforeSave: false });
        }
        res.status(500).json({
            message: "Error sending password reset email.",
            error: error.message,
        });
    }
};

// 5. Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { email, code, password } = req.body;

        const user = await User.findOne({
            email,
            resetCode: code,
            resetCodeExpires: { $gt: Date.now() },
        }).select("+resetCode +resetCodeExpires");

        if (!user) {
            return res
                .status(400)
                .json({ message: "Reset code is invalid or has expired." });
        }

        user.password = password;
        user.resetCode = undefined;
        user.resetCodeExpires = undefined;
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            message: "Password has been reset successfully.",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error during password reset.",
            error: error.message,
        });
    }
};

// 6. Logout (Placeholder - main logic is on client-side)
export const logout = (req, res) => {
    // On the client-side, you will remove the JWT.
    // Server-side logic could be added here for blacklisting tokens if needed.
    res.status(200).json({ message: "Logged out successfully." });
};
