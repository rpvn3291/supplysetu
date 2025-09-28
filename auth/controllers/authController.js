// filename: controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler'); // Helps handle errors without try...catch
const { generateToken } = require('../services/tokenService');
const { hashPassword, comparePassword } = require('../utils/passwordUtils.js');

const prisma = new PrismaClient();

// --- AUTHENTICATION ---

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, role, profileData } = req.body;

  const passwordHash = await hashPassword(password);

  // Prisma's relational write makes this much cleaner than a manual transaction.
  // It automatically creates the user and the related profile in one step.
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      [role === 'VENDOR' ? 'vendorProfile' : 'supplierProfile']: {
        create: profileData,
      },
    },
    select: { id: true, email: true, role: true } // Only select safe fields to return
  });

  const token = generateToken(user);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user
  });
});

/**
 * @desc    Authenticate a user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  // If user doesn't exist or password doesn't match, throw an error.
  // The centralized error handler will catch this.
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401); // Set the status code
    throw new Error('Invalid credentials'); // Throw an error
  }

  const token = generateToken(user);

  res.status(200).json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});


// --- USER PROFILE ---

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // The authMiddleware has already attached the user to req.user
  const userId = req.user.id;
  let profile = null;

  if (req.user.role === 'VENDOR') {
    profile = await prisma.vendorProfile.findUnique({ where: { userId } });
  } else if (req.user.role === 'SUPPLIER') {
    profile = await prisma.supplierProfile.findUnique({ where: { userId } });
  }

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found for this user.');
  }

  res.status(200).json({
    user: req.user,
    profile: profile
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const profileData = req.body;
  let updatedProfile;

  if (role === 'VENDOR') {
    updatedProfile = await prisma.vendorProfile.update({
      where: { userId: id },
      data: profileData,
    });
  } else if (role === 'SUPPLIER') {
    updatedProfile = await prisma.supplierProfile.update({
      where: { userId: id },
      data: profileData,
    });
  }

  res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
});


// --- ADMIN ---

/**
 * @desc    Toggle a user's KYC verification status
 * @route   PATCH /api/auth/toggle-kyc/:userId
 * @access  Public (for now, should be Admin-only)
 */
const toggleKycStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: !user.isVerified },
    select: { id: true, email: true, isVerified: true }
  });

  res.status(200).json({
    message: `User KYC status toggled to ${updatedUser.isVerified}`,
    user: updatedUser
  });
});


// Export all controller functions
module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  toggleKycStatus
};

