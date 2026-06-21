const express = require('express');
const router = express.Router();
const events = require('../controllers/events');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, hasRole, isOrganizer } = require('../middleware/auth');
const { validateEvent, validateUpdateEvent } = require('../middleware/validation');
const { safeUploadSingle } = require('../middleware/multer');

// AI Assistant endpoints
router.post('/ai/generate-description', isLoggedIn, hasRole(['organizer', 'admin']), catchAsync(events.generateAIDescription));
router.post('/ai/suggest', isLoggedIn, hasRole(['organizer', 'admin']), catchAsync(events.suggestAICategory));

// General Event Routes
router.route('/')
  .get(catchAsync(events.index))
  .post(isLoggedIn, hasRole(['organizer', 'admin']), safeUploadSingle('poster'), validateEvent, catchAsync(events.create));

router.get('/new', isLoggedIn, hasRole(['organizer', 'admin']), events.renderNew);

router.route('/:id')
  .get(catchAsync(events.show))
  .put(isLoggedIn, isOrganizer, safeUploadSingle('poster'), validateUpdateEvent, catchAsync(events.update))
  .delete(isLoggedIn, isOrganizer, catchAsync(events.delete));

router.get('/:id/edit', isLoggedIn, isOrganizer, catchAsync(events.renderEdit));

// Wishlist trigger
router.post('/:id/wishlist', isLoggedIn, catchAsync(events.toggleWishlist));

// Review Summary generation
router.post('/:id/summarize', isLoggedIn, isOrganizer, catchAsync(events.generateAIReviewSummary));

// Calendar download
router.get('/:id/ics', catchAsync(events.downloadCalendarInvite));

module.exports = router;
