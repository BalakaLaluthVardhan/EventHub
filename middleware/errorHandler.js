/**
 * Centralized Express error handler
 */
const errorHandler = (err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Something went wrong on our campus hub!';
  
  console.error('Error Stack:', err.stack || err);

  // If it's an API/AJAX request, return JSON
  if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
    return res.status(statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Render error page
  res.status(statusCode).render('error', {
    err,
    title: `Error - ${statusCode}`,
    user: req.user || null
  });
};

module.exports = errorHandler;
