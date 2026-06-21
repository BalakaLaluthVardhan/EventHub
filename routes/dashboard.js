const express = require('express');
const router = express.Router();
const dashboard = require('../controllers/dashboard');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, catchAsync(dashboard.index));
router.get('/events/:id/registrations', isLoggedIn, catchAsync(dashboard.viewEventRegistrations));
router.get('/events/:id/export', isLoggedIn, catchAsync(dashboard.exportRegistrations));

module.exports = router;
