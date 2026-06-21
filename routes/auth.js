const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require('../controllers/auth');
const catchAsync = require('../utils/catchAsync');
const { validateRegistration } = require('../middleware/validation');
const { isLoggedIn } = require('../middleware/auth');

router.route('/register')
  .get(auth.renderRegister)
  .post(validateRegistration, catchAsync(auth.register));

router.route('/login')
  .get(auth.renderLogin)
  .post(
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
      keepSessionInfo: true // Keeps session details like returnTo intact
    }),
    auth.login
  );

router.get('/logout', auth.logout);

router.route('/profile')
  .get(isLoggedIn, catchAsync(auth.renderProfile))
  .post(isLoggedIn, catchAsync(auth.updateProfile));

// Google OAuth Routes
router.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect('/auth/google/mock');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureFlash: true, 
    failureRedirect: '/login',
    keepSessionInfo: true
  }), 
  auth.googleCallback
);

router.get('/auth/google/mock', catchAsync(auth.mockGoogleLogin));

// Complete Profile (for Google Users)
router.route('/complete-profile')
  .get(isLoggedIn, auth.renderCompleteProfile)
  .post(isLoggedIn, catchAsync(auth.completeProfile));

// Forgot Password Flow
router.route('/forgot-password')
  .get(auth.renderForgotPassword)
  .post(catchAsync(auth.forgotPassword));

// Reset Password Flow
router.route('/reset-password/:token')
  .get(catchAsync(auth.renderResetPassword))
  .post(catchAsync(auth.resetPassword));

module.exports = router;
