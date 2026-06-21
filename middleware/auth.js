const Event = require('../models/Event');

/**
 * Guard to verify the user is logged in
 */
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'You must be signed in first!');
    return res.redirect('/login');
  }
  next();
};

/**
 * Guard to verify the user has one of the allowed roles
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Authentication required.');
      return res.redirect('/login');
    }
    if (!roles.includes(req.user.role)) {
      req.flash('error', 'You do not have permission to access this page.');
      return res.redirect('/');
    }
    next();
  };
};

/**
 * Guard to verify the logged-in user is the organizer of the event (or admin)
 */
const isOrganizer = async (req, res, next) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }
    if (!event.organizer.equals(req.user._id) && req.user.role !== 'admin') {
      req.flash('error', 'You do not have permission to modify this event.');
      return res.redirect(`/events/${id}`);
    }
    next();
  } catch (error) {
    console.error('Error in isOrganizer guard:', error);
    req.flash('error', 'Something went wrong verifying permissions.');
    res.redirect('/events');
  }
};

module.exports = {
  isLoggedIn,
  hasRole,
  isOrganizer
};
