const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const auth = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  passwordResetRequestValidation,
  passwordResetValidation,
  updateProfileValidation
} = require('../middleware/validate');

const router = express.Router();

// Register
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ email, password, name });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      token,
      verificationToken,
      message: 'Registration successful. Please verify your email.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// Update profile
router.put('/profile', auth, updateProfileValidation, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.email = email;
      updates.emailVerified = false;
    }
    await req.user.update(updates);
    res.json({ user: req.user, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', auth, changePasswordValidation, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isValid = await req.user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    req.user.password = newPassword;
    await req.user.save();

    const token = jwt.sign(
      { id: req.user.id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { expiresIn: '7d' }
    );

    res.json({ message: 'Password changed successfully', token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', passwordResetLimiter, passwordResetRequestValidation, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // In production, send email. For now, return token.
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      resetToken // Remove in production - only for demo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', passwordResetLimiter, passwordResetValidation, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken
      }
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    const jwtToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { expiresIn: '7d' }
    );

    res.json({ message: 'Password reset successful', token: jwtToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: { emailVerificationToken: hashedToken }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({ message: 'Email verified successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Resend verification email
router.post('/resend-verification', auth, async (req, res) => {
  try {
    if (req.user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const verificationToken = req.user.generateEmailVerificationToken();
    await req.user.save();

    res.json({
      message: 'Verification email sent',
      verificationToken // Remove in production
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Password strength check (no auth required)
router.post('/check-password-strength', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });

  let score = 0;
  const feedback = [];

  if (password.length >= 8) score += 1; else feedback.push('At least 8 characters');
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1; else feedback.push('Add uppercase letter');
  if (/[a-z]/.test(password)) score += 1; else feedback.push('Add lowercase letter');
  if (/[0-9]/.test(password)) score += 1; else feedback.push('Add a number');
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; else feedback.push('Add special character');
  if (password.length >= 16) score += 1;

  const levels = ['very_weak', 'weak', 'fair', 'good', 'strong', 'very_strong', 'excellent'];
  const strength = levels[Math.min(score, levels.length - 1)];

  res.json({ score, strength, feedback, maxScore: 7 });
});

module.exports = router;
