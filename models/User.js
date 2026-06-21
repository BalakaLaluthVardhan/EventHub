const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['student', 'organizer', 'admin'],
    default: 'student'
  },
  interests: {
    type: [String],
    default: [],
    enum: ['Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports']
  },
  wishlist: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event'
    }
  ],
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Configure passport-local-mongoose to use 'email' as the username field
UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  errorMessages: {
    UserExistsError: 'A user with the given email is already registered'
  }
});

module.exports = mongoose.model('User', UserSchema);
