/**
 * Centralized Express error handler
 */
const errorHandler = (err, req, res, next) => {
  const { statusCode = 500 } = err;
  
  let displayMessage = err.message || 'Something went wrong on our campus hub!';
  let isDbTimeout = false;

  // Handle Mongoose connection and buffering timeout errors cleanly
  if (err.name === 'MongooseError' && err.message && err.message.includes('buffering timed out')) {
    isDbTimeout = true;
    displayMessage = 'Database Connection Timeout: The server was unable to communicate with MongoDB. Please verify that MONGODB_URI is correctly configured in your deployment settings and that your MongoDB Atlas IP Access List allows connections from anywhere (0.0.0.0/0).';
  }
  
  console.error('Error Stack:', err.stack || err);

  // If it's an API/AJAX request, return JSON
  if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
    return res.status(statusCode).json({
      success: false,
      message: displayMessage,
      isDbTimeout
    });
  }

  // Render error page
  res.status(statusCode).render('error', {
    err: { ...err, message: displayMessage },
    title: `Error - ${statusCode}`,
    user: req.user || null,
    isDbTimeout
  });
};

module.exports = errorHandler;
