const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RegistrationSchema = new Schema({
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'waitlisted', 'attended', 'cancelled'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only register once per event (can have different status, but only one document)
RegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
