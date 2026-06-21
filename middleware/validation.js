const Joi = require('joi');

/**
 * Event form schema for creation
 */
const createEventSchema = Joi.object({
  event: Joi.object({
    title: Joi.string().required().trim().max(100),
    category: Joi.string().required().valid('Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports'),
    date: Joi.date().required().greater('now').message('Event date must be in the future'),
    time: Joi.string().required().trim(),
    venue: Joi.string().required().trim().max(150),
    address: Joi.string().required().trim().max(200),
    lat: Joi.number().optional().min(-90).max(90),
    lng: Joi.number().optional().min(-180).max(180),
    price: Joi.number().required().min(0),
    capacity: Joi.number().required().min(1),
    summary: Joi.string().allow('').trim().max(250),
    description: Joi.string().required(),
    tags: Joi.string().allow('').trim() // We'll parse tags in controller
  }).required()
});

/**
 * Event form schema for updating
 */
const updateEventSchema = Joi.object({
  event: Joi.object({
    title: Joi.string().required().trim().max(100),
    category: Joi.string().required().valid('Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports'),
    date: Joi.date().required(),
    time: Joi.string().required().trim(),
    venue: Joi.string().required().trim().max(150),
    address: Joi.string().required().trim().max(200),
    lat: Joi.number().optional().min(-90).max(90),
    lng: Joi.number().optional().min(-180).max(180),
    price: Joi.number().required().min(0),
    capacity: Joi.number().required().min(1),
    summary: Joi.string().allow('').trim().max(250),
    description: Joi.string().required(),
    status: Joi.string().valid('open', 'closed', 'completed', 'cancelled'),
    tags: Joi.string().allow('').trim() // We'll parse tags in controller
  }).required()
});

/**
 * Review form schema
 */
const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required().trim().max(1000)
  }).required()
});

/**
 * User register form schema
 */
const registerSchema = Joi.object({
  name: Joi.string().required().trim().max(50),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required().min(6).message('Password must be at least 6 characters long'),
  role: Joi.string().required().valid('student', 'organizer'),
  interests: Joi.array().items(Joi.string().valid('Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports')).single()
});

const validateEvent = (req, res, next) => {
  const { error } = createEventSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    req.flash('error', msg);
    return res.redirect('back');
  }
  next();
};

const validateUpdateEvent = (req, res, next) => {
  const { error } = updateEventSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    req.flash('error', msg);
    return res.redirect('back');
  }
  next();
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    req.flash('error', msg);
    return res.redirect('back');
  }
  next();
};

const validateRegistration = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    req.flash('error', msg);
    return res.redirect('back');
  }
  next();
};

module.exports = {
  validateEvent,
  validateUpdateEvent,
  validateReview,
  validateRegistration
};
