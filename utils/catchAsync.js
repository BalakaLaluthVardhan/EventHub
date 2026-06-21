/**
 * Wraps asynchronous routes to automatically catch errors and pass them to the express error handler
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
