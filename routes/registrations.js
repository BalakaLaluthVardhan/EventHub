const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable mergeParams to access :eventId from parent routers
const registrations = require('../controllers/registrations');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, hasRole } = require('../middleware/auth');

router.post('/events/:eventId/register', isLoggedIn, catchAsync(registrations.register));
router.post('/events/:eventId/cancel', isLoggedIn, catchAsync(registrations.cancel));

router.route('/events/:eventId/checkout')
  .get(isLoggedIn, catchAsync(registrations.renderCheckout))
  .post(isLoggedIn, catchAsync(registrations.processCheckout));

// Dedicated attendance route
router.post('/events/attendance/:regId', isLoggedIn, hasRole(['organizer', 'admin']), catchAsync(registrations.markAttendance));

module.exports = router;
