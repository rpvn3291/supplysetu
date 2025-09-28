// filename: routes/authRoutes.js
const express = require('express');
const { register, login, getMe, updateProfile, toggleKycStatus } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

const router = express.Router();

// Public routes with validation
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

// Protected User Routes
router.get('/me', authMiddleware, getMe);
router.put('/update-profile', authMiddleware, updateProfile);

// Simple Admin Route
router.patch('/toggle-kyc/:userId', toggleKycStatus);

module.exports = router;

