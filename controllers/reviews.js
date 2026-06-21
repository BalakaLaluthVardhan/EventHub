const Review = require('../models/Review');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

/**
 * Submit feedback/review for a completed event
 */
module.exports.create = async (req, res) => {
  const { eventId } = req.params;
  const { rating, comment } = req.body.review;
  const userId = req.user._id;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    // Business rule: Check if the user registered and attended the event
    const attendanceRecord = await Registration.findOne({
      event: eventId,
      user: userId,
      status: 'attended'
    });

    if (!attendanceRecord && req.user.role !== 'admin') {
      req.flash('error', 'Only attendees who participated in the event can leave a review.');
      return res.redirect(`/events/${eventId}`);
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ event: eventId, user: userId });
    if (existingReview) {
      req.flash('error', 'You have already submitted a review for this event.');
      return res.redirect(`/events/${eventId}`);
    }

    const review = new Review({
      event: eventId,
      user: userId,
      rating: parseInt(rating, 10),
      comment
    });

    await review.save();
    req.flash('success', 'Your review has been published successfully!');
    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error('Submit review error:', error);
    req.flash('error', 'Failed to publish review.');
    res.redirect(`/events/${eventId}`);
  }
};

/**
 * Delete a review (Reviewer or Admin only)
 */
module.exports.delete = async (req, res) => {
  const { eventId, reviewId } = req.params;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Review not found.');
      return res.redirect(`/events/${eventId}`);
    }

    // Verify ownership or admin privileges
    if (!review.user.equals(req.user._id) && req.user.role !== 'admin') {
      req.flash('error', 'Unauthorized operation.');
      return res.redirect(`/events/${eventId}`);
    }

    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Review deleted successfully.');
    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'Failed to delete review.');
    res.redirect(`/events/${eventId}`);
  }
};
