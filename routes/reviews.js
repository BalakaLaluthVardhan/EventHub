const express = require('express');
const router = express.Router({ mergeParams: true });
const reviews = require('../controllers/reviews');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

router.post('/', isLoggedIn, validateReview, catchAsync(reviews.create));
router.delete('/:reviewId', isLoggedIn, catchAsync(reviews.delete));

module.exports = router;
