const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports']
  },
  tags: {
    type: [String],
    default: []
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  poster: {
    type: String,
    default: '/images/default-poster.svg'
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'completed', 'cancelled'],
    default: 'open'
  },
  reviewSummary: {
    type: String
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for formatted date string
EventSchema.virtual('formattedDate').get(function () {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

module.exports = mongoose.model('Event', EventSchema);
