const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user.models');

const router = express.Router();

// Validation middleware for registration
const registrationValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Invalid email format')
        .isLength({ min: 13 }).withMessage('Email must be at least 13 characters'),
    body('password')
        .trim()
        .isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
    body('username')
        .trim()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
];

// Render registration page
router.get('/register', (req, res) => {
    res.render('register');
});

// User registration route
router.post('/register', registrationValidation, async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
            message: 'Invalid registration data'
        });
    }

    try {
        const { email, username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email or username'
            });
        }

        // Create new user
        const newUser = await User.create({
            email,
            username,
            password
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error during registration'
        });
    }
});

// Render login page
router.get('/login', (req, res) => {
    res.render('login');
});

// User login route
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required')
], async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
            message: 'Invalid login data'
        });
    }

    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid username or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour
        });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error during login'
        });
    }
});

module.exports = router;