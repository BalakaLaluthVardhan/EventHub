const Event = require('../../models/Event');
const Registration = require('../../models/Registration');

/**
 * Gets personalized upcoming event recommendations for a user.
 * @param {Object} user - The mongoose User document.
 * @param {number} limit - Maximum number of recommendations to return.
 * @returns {Promise<Array>} - Array of scored event documents.
 */
async function getRecommendations(user, limit = 5) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get all upcoming open events
    const upcomingEvents = await Event.find({
      date: { $gte: today },
      status: 'open'
    }).populate('organizer', 'name');

    if (!upcomingEvents.length) {
      return [];
    }

    // 2. Get user's active registrations to exclude them
    const userRegistrations = await Registration.find({
      user: user._id,
      status: { $in: ['registered', 'waitlisted', 'attended'] }
    });
    
    const registeredEventIds = userRegistrations.map(r => r.event.toString());

    // Filter out events user has already registered for
    const eligibleEvents = upcomingEvents.filter(event => 
      !registeredEventIds.includes(event._id.toString())
    );

    if (!eligibleEvents.length) {
      return [];
    }

    // 3. Get total registrations per eligible event for popularity scores
    const registrationCounts = await Registration.aggregate([
      { $match: { event: { $in: eligibleEvents.map(e => e._id) }, status: 'registered' } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]);

    const popularityMap = {};
    registrationCounts.forEach(item => {
      popularityMap[item._id.toString()] = item.count;
    });

    // 4. Calculate category affinity from user's registration history
    const pastRegistrations = await Registration.find({ user: user._id })
      .populate('event', 'category');

    const categoryCounts = {};
    pastRegistrations.forEach(r => {
      if (r.event && r.event.category) {
        categoryCounts[r.event.category] = (categoryCounts[r.event.category] || 0) + 1;
      }
    });

    // 5. Score each eligible event
    const scoredEvents = eligibleEvents.map(event => {
      let score = 0;
      const eventIdStr = event._id.toString();

      // Interest Match (User specified interests in registration/profile)
      if (user.interests && user.interests.includes(event.category)) {
        score += 5;
      }

      // Past registrations category affinity
      if (categoryCounts[event.category]) {
        score += categoryCounts[event.category] * 2;
      }

      // Wishlist Match (strong signal of intent)
      if (user.wishlist && user.wishlist.some(wId => wId.toString() === eventIdStr)) {
        score += 10;
      }

      // Popularity score (0.2 points per registered user, capped at 10 points)
      const regCount = popularityMap[eventIdStr] || 0;
      score += Math.min(regCount * 0.2, 10);

      // Boost tag matching (if any user interests match event tags)
      if (user.interests && event.tags) {
        const matchingTags = event.tags.filter(tag => 
          user.interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
        );
        score += matchingTags.length * 1.5;
      }

      return {
        event,
        score
      };
    });

    // 6. Sort by score descending and return top limit events
    scoredEvents.sort((a, b) => b.score - a.score);
    
    return scoredEvents.slice(0, limit).map(item => item.event);

  } catch (error) {
    console.error('Error in recommendation service:', error);
    // Fallback: return top popular/upcoming events
    try {
      return await Event.find({ date: { $gte: new Date() }, status: 'open' })
        .limit(limit)
        .populate('organizer', 'name');
    } catch (fallbackError) {
      console.error('Fallback recommendation failed:', fallbackError);
      return [];
    }
  }
}

module.exports = {
  getRecommendations
};
