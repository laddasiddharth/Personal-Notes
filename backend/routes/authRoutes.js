const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_key';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ========================================================
// 1. POST /api/auth/register
// Registers a new user with hashed password & returns a JWT
// ========================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Type validation
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Name cannot exceed 100 characters' });
    }

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 254 || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'Password is required and must be at least 6 characters long',
      });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password cannot exceed 128 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash the password using bcrypt with 10 salt rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save new user
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Generate JWT token containing user id, email, and name
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email, name: savedUser.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (err) {
    // Handle MongoDB duplicate key error gracefully
    if (err.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    console.error('Register error:', err);
    res.status(500).json({
      error: 'Failed to register user',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }
});

// ========================================================
// 2. POST /api/auth/login
// Verifies credentials, compares bcrypt hash, & returns a JWT
// ========================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Type and existence validation
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare supplied password with stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Failed to log in',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }
});

// ========================================================
// 3. GET /api/auth/me
// Returns the currently authenticated user's details
// ========================================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      error: 'Failed to retrieve profile',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }
});

module.exports = router;
