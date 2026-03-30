/**
 * Wrapper for async route handlers to automatically catch errors
 * and pass them to Express error handling middleware
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncController = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncController;