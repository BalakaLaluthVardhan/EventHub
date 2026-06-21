const User = require('../models/User');
const crypto = require('crypto');
const emailService = require('../services/email/emailService');

/**
 * Render registration form
 */
module.exports.renderRegister = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', { title: 'Register - College Event Hub' });
};

/**
 * Handle user registration
 */
module.exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, interests } = req.body;
    
    // Convert single string or array of interests
    const parsedInterests = Array.isArray(interests) 
      ? interests 
      : (interests ? [interests] : []);

    const user = new User({
      name,
      email,
      role,
      interests: parsedInterests,
      isProfileComplete: true
    });

    const registeredUser = await User.register(user, password);
    
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash('success', `Welcome to College Event Hub, ${name}!`);
      res.redirect('/dashboard');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
};

/**
 * Render login form
 */
module.exports.renderLogin = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { title: 'Login - College Event Hub' });
};

/**
 * Handle login success redirect
 */
module.exports.login = (req, res) => {
  req.flash('success', `Welcome back, ${req.user.name}!`);
  const redirectUrl = req.session.returnTo || '/dashboard';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

/**
 * Handle user logout
 */
module.exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Goodbye! You have been successfully signed out.');
    res.redirect('/login');
  });
};

/**
 * Get user profile edit form / view
 */
module.exports.renderProfile = async (req, res) => {
  res.render('auth/profile', { 
    title: 'My Profile - College Event Hub',
    user: req.user
  });
};

/**
 * Update user interests & profile details
 */
module.exports.updateProfile = async (req, res) => {
  try {
    const { name, interests } = req.body;
    const parsedInterests = Array.isArray(interests) 
      ? interests 
      : (interests ? [interests] : []);

    await User.findByIdAndUpdate(req.user._id, {
      name,
      interests: parsedInterests
    });

    req.flash('success', 'Profile updated successfully!');
    res.redirect('/profile');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/profile');
  }
};

/**
 * Handle Google login callback redirect
 */
module.exports.googleCallback = (req, res) => {
  const user = req.user;
  
  // Check if profile is incomplete
  if (!user.isProfileComplete) {
    req.flash('info', 'Successfully authenticated with Google! Please complete your profile details.');
    return res.redirect('/complete-profile');
  }
  
  req.flash('success', `Welcome back, ${user.name}!`);
  res.redirect('/dashboard');
};

/**
 * Handle Mock Google login for development/testing
 */
module.exports.mockGoogleLogin = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLIENT_ID) {
    req.flash('error', 'Mock Google login is only available in development mode.');
    return res.redirect('/login');
  }
  
  const mockProfile = {
    id: 'mock-google-id-123456789',
    displayName: 'Mock Google User',
    email: 'mock.google@college.edu'
  };

  try {
    let user = await User.findOne({ googleId: mockProfile.id });
    if (!user) {
      user = await User.findOne({ email: mockProfile.email });
      if (user) {
        user.googleId = mockProfile.id;
        await user.save();
      } else {
        user = new User({
          googleId: mockProfile.id,
          email: mockProfile.email,
          name: mockProfile.displayName,
          role: 'student',
          isProfileComplete: false
        });
        await user.save();
      }
    }

    req.login(user, err => {
      if (err) return next(err);
      
      if (!user.isProfileComplete) {
        req.flash('info', 'Successfully authenticated via Mock Google! Please complete your profile registration details.');
        return res.redirect('/complete-profile');
      }

      req.flash('success', `Welcome back, ${user.name}!`);
      res.redirect('/dashboard');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/login');
  }
};

/**
 * Render complete profile form
 */
module.exports.renderCompleteProfile = (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be signed in to access this page.');
    return res.redirect('/login');
  }
  if (req.user.isProfileComplete) {
    return res.redirect('/dashboard');
  }
  res.render('auth/complete-profile', { title: 'Complete Profile - College Event Hub' });
};

/**
 * Save complete profile details
 */
module.exports.completeProfile = async (req, res) => {
  try {
    const { role, interests } = req.body;

    const parsedInterests = Array.isArray(interests) 
      ? interests 
      : (interests ? [interests] : []);

    await User.findByIdAndUpdate(req.user._id, {
      role,
      interests: parsedInterests,
      isProfileComplete: true
    });

    req.flash('success', 'Profile configuration complete!');
    res.redirect('/dashboard');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/complete-profile');
  }
};

/**
 * Render forgot password request form
 */
module.exports.renderForgotPassword = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('auth/forgot-password', { title: 'Forgot Password - College Event Hub' });
};

/**
 * Handle forgot password request
 */
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'No account with that email address exists.');
      return res.redirect('/forgot-password');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
    await emailService.sendPasswordResetEmail(user, resetUrl);

    req.flash('success', `An email has been sent to ${user.email} with instructions to reset your password.`);
    res.redirect('/login');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/forgot-password');
  }
};

/**
 * Render password reset form
 */
module.exports.renderResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot-password');
    }

    res.render('auth/reset-password', { 
      title: 'Reset Password - College Event Hub', 
      token: req.params.token 
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/forgot-password');
  }
};

/**
 * Handle password reset submission
 */
module.exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot-password');
    }

    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('back');
    }

    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.login(user, err => {
      if (err) return next(err);
      req.flash('success', 'Your password has been reset and you are now signed in!');
      res.redirect('/dashboard');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/forgot-password');
  }
};
