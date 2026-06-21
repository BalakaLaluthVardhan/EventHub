const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/User');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const dashboardRoutes = require('./routes/dashboard');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college-event-hub';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('📁  MongoDB connected successfully.'))
  .catch(err => console.error('❌  MongoDB connection error:', err));

// Views engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Security
app.use(mongoSanitize());
app.use(
  helmet({
    contentSecurityPolicy: false // Disabled for dev loading of CDNs (Mapbox, Leaflet, Chart.js, Bootstrap)
  })
);

// Sessions configuration
const sessionConfig = {
  name: 'session',
  secret: process.env.SESSION_SECRET || 'supersecretcampuscommunitytoken',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};
app.use(session(sessionConfig));
app.use(flash());

// Passport auth configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));

const GoogleStrategy = require('passport-google-oauth20').Strategy;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          await user.save();
        } else {
          user = new User({
            googleId: profile.id,
            email: email,
            name: profile.displayName || 'Google User',
            role: 'student', // placeholder, will complete in next step
            isProfileComplete: false
          });
          await user.save();
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️  Google OAuth credentials missing in .env. Mock Google Sign-In pathway will be enabled in development mode.');
}

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global template variables
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  res.locals.warning = req.flash('warning');
  next();
});

// Mount Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'College Event Hub' });
});

app.use('/', authRoutes);
app.use('/events', eventRoutes);
app.use('/events/:eventId/reviews', reviewRoutes);
app.use('/', registrationRoutes);
app.use('/dashboard', dashboardRoutes);

// Catch all unmatched routes
app.all('*', (req, res, next) => {
  const err = new Error('Page Not Found');
  err.statusCode = 404;
  next(err);
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  College Event Hub running on: http://localhost:${PORT}`);
});
