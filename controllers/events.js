const Event = require('../models/Event');
const Review = require('../models/Review');
const Registration = require('../models/Registration');
const User = require('../models/User');
const aiService = require('../services/ai/aiService');
const calendarService = require('../services/calendar/calendarService');
const geocodingService = require('../services/map/geocodingService');

/**
 * List events with advanced filters
 */
module.exports.index = async (req, res) => {
  const { category, price, search, dateRange, status, sort } = req.query;
  const query = {};

  // 1. Search filter (text search on title, venue, or summary)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { venue: { $regex: search, $options: 'i' } },
      { summary: { $regex: search, $options: 'i' } }
    ];
  }

  // 2. Category filter
  if (category && category !== 'All') {
    query.category = category;
  }

  // 3. Price filter
  if (price) {
    if (price === 'free') {
      query.price = 0;
    } else if (price === 'paid') {
      query.price = { $gt: 0 };
    }
  }

  // 4. Status filter
  if (status && status !== 'All') {
    query.status = status;
  }

  // 5. Date filter
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateRange) {
    if (dateRange === 'week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      query.date = { $gte: today, $lte: nextWeek };
    } else if (dateRange === 'month') {
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      query.date = { $gte: today, $lte: nextMonth };
    } else if (dateRange === 'past') {
      query.date = { $lt: today };
    } else if (dateRange === 'upcoming') {
      query.date = { $gte: today };
    }
  } else {
    // Default to show upcoming events
    if (!search && !status) {
      query.date = { $gte: today };
    }
  }

  // 6. Sorting
  let sortOption = { date: 1 }; // Default: nearest upcoming date
  if (sort === 'popularity') {
    sortOption = { registrationCount: -1, date: 1 };
  } else if (sort === 'date-desc') {
    sortOption = { date: -1 };
  }

  const events = await Event.find(query)
    .populate('organizer', 'name')
    .sort(sortOption);

  res.render('events/index', {
    title: 'Discover Events - College Event Hub',
    events,
    filters: req.query
  });
};

/**
 * Show event detail page
 */
module.exports.show = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id).populate('organizer', 'name email');
  
  if (!event) {
    req.flash('error', 'Event not found.');
    return res.redirect('/events');
  }

  // Fetch reviews for this event
  const reviews = await Review.find({ event: id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  // Calculate average rating
  const avgRating = reviews.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  // Check if current user is registered, waitlisted, or wishlisted
  let registrationStatus = null;
  let isWishlisted = false;

  if (req.user) {
    const reg = await Registration.findOne({ event: id, user: req.user._id });
    if (reg) registrationStatus = reg.status;

    isWishlisted = req.user.wishlist.some(wId => wId.equals(event._id));
  }

  const googleCalUrl = calendarService.generateGoogleCalendarUrl(event);

  res.render('events/show', {
    title: `${event.title} - College Event Hub`,
    event,
    reviews,
    avgRating,
    registrationStatus,
    isWishlisted,
    googleCalUrl
  });
};

/**
 * Render new event creation form
 */
module.exports.renderNew = (req, res) => {
  res.render('events/new', { title: 'Create Event - College Event Hub' });
};

/**
 * Create new event
 */
module.exports.create = async (req, res) => {
  const { title, category, date, time, venue, address, lat, lng, price, capacity, summary, description, tags } = req.body.event;

  // Process uploaded file
  let poster = '/images/default-poster.svg';
  if (req.file) {
    poster = (req.file.path && req.file.path.startsWith('http')) 
      ? req.file.path 
      : `/uploads/${req.file.filename}`;
  }

  // Process tags
  const tagsArray = tags 
    ? tags.split(',').map(tag => tag.trim()).filter(Boolean) 
    : [];

  // Geocode address automatically
  let geocodedCoords = null;
  try {
    geocodedCoords = await geocodingService.geocode(address);
  } catch (err) {
    console.error('Failed to geocode address on creation:', err);
  }

  // Fall back to map picker coordinates or default Bangalore coordinates if geocoding fails
  const latitude = geocodedCoords ? geocodedCoords.lat : (parseFloat(lat) || 12.971599);
  const longitude = geocodedCoords ? geocodedCoords.lng : (parseFloat(lng) || 77.594563);

  const event = new Event({
    title,
    category,
    date,
    time,
    venue,
    address,
    coordinates: { lat: latitude, lng: longitude },
    price: parseFloat(price),
    capacity: parseInt(capacity, 10),
    summary,
    description,
    tags: tagsArray,
    poster,
    organizer: req.user._id
  });

  await event.save();
  if (req.fileUploadError) {
    req.flash('warning', `Event published, but image upload failed: ${req.fileUploadError.message || 'Access Forbidden'}. Default poster used.`);
  } else {
    req.flash('success', 'Successfully created a new event!');
  }
  res.redirect(`/events/${event._id}`);
};

/**
 * Render edit event form
 */
module.exports.renderEdit = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) {
    req.flash('error', 'Event not found.');
    return res.redirect('/events');
  }
  res.render('events/edit', { title: `Edit ${event.title} - College Event Hub`, event });
};

/**
 * Update event details
 */
module.exports.update = async (req, res) => {
  const { id } = req.params;
  const { title, category, date, time, venue, address, lat, lng, price, capacity, summary, description, tags, status } = req.body.event;

  const event = await Event.findById(id);
  if (!event) {
    req.flash('error', 'Event not found.');
    return res.redirect('/events');
  }

  // Update poster if a new one is uploaded
  if (req.file) {
    event.poster = (req.file.path && req.file.path.startsWith('http')) 
      ? req.file.path 
      : `/uploads/${req.file.filename}`;
  }

  // Geocode address automatically if it's new/updated
  let geocodedCoords = null;
  if (address && address !== event.address) {
    try {
      geocodedCoords = await geocodingService.geocode(address);
    } catch (err) {
      console.error('Failed to geocode address on update:', err);
    }
  }

  event.title = title;
  event.category = category;
  event.date = date;
  event.time = time;
  event.venue = venue;
  event.address = address;
  
  if (geocodedCoords) {
    event.coordinates = { lat: geocodedCoords.lat, lng: geocodedCoords.lng };
  } else {
    event.coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };
  }

  event.price = parseFloat(price);
  event.capacity = parseInt(capacity, 10);
  event.summary = summary;
  event.description = description;
  event.tags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  const oldStatus = event.status;
  event.status = status;

  await event.save();
  if (req.fileUploadError) {
    req.flash('warning', `Event details saved, but image update failed: ${req.fileUploadError.message || 'Access Forbidden'}. Existing poster kept.`);
  } else {
    req.flash('success', 'Successfully updated event!');
  }

  // If the event was cancelled, send notifications to registered users
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    const registrations = await Registration.find({ event: id, status: 'registered' }).populate('user');
    const emailService = require('../services/email/emailService');
    for (const reg of registrations) {
      if (reg.user) {
        await emailService.sendEventUpdateNotification(reg.user, event, 'This event has been cancelled by the organizer. A refund/cancellation process has been initiated if applicable.');
      }
    }
  }

  req.flash('success', 'Successfully updated event!');
  res.redirect(`/events/${event._id}`);
};

/**
 * Delete event
 */
module.exports.delete = async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️  Deleting event with ID: ${id}`);
  await Event.findByIdAndDelete(id);
  // Remove registrations associated with this event
  await Registration.deleteMany({ event: id });
  // Remove reviews associated with this event
  await Review.deleteMany({ event: id });

  req.flash('success', 'Event deleted successfully.');
  res.redirect('/dashboard');
};

/**
 * Toggle Event Wishlist status (AJAX Endpoint)
 */
module.exports.toggleWishlist = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  
  const eventIdx = user.wishlist.indexOf(id);
  let wishlisted = false;

  if (eventIdx > -1) {
    user.wishlist.splice(eventIdx, 1);
  } else {
    user.wishlist.push(id);
    wishlisted = true;
  }

  await user.save();
  res.json({ success: true, wishlisted });
};

/**
 * AJAX endpoint: Generate event description using OpenRouter
 */
module.exports.generateAIDescription = async (req, res) => {
  const { title, notes } = req.body;
  if (!title || !notes) {
    return res.status(400).json({ success: false, message: 'Title and notes are required to generate description.' });
  }

  try {
    const description = await aiService.generateDescription(title, notes);
    res.json({ success: true, description });
  } catch (error) {
    console.error('AI description generation failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AJAX endpoint: Suggest event category and tags using OpenRouter
 */
module.exports.suggestAICategory = async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required.' });
  }

  try {
    const result = await aiService.categorizeEvent(title, description);
    res.json({ success: true, category: result.category, tags: result.tags });
  } catch (error) {
    console.error('AI categorization suggestion failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AJAX/POST endpoint: Summarize reviews for organizers
 */
module.exports.generateAIReviewSummary = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  try {
    const reviews = await Review.find({ event: id });
    if (!reviews.length) {
      return res.status(400).json({ success: false, message: 'Cannot generate summary because this event has no reviews yet.' });
    }

    const summary = await aiService.summarizeReviews(reviews);
    event.reviewSummary = summary;
    await event.save();

    res.json({ success: true, summary });
  } catch (error) {
    console.error('AI review summarization failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET endpoint: Download calendar invite .ics file
 */
module.exports.downloadCalendarInvite = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id).populate('organizer', 'name email');
  
  if (!event) {
    req.flash('error', 'Event not found');
    return res.redirect('back');
  }

  try {
    const icsContent = calendarService.generateICS(event);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/\s+/g, '_')}_invite.ics"`);
    res.send(icsContent);
  } catch (err) {
    console.error('Failed to generate calendar invite file:', err);
    req.flash('error', 'Could not generate calendar invitation file.');
    res.redirect('back');
  }
};
