/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Set default values if not provided by custom error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorType = err.errorType || 'Error';

  // Log error for debugging (in production, use proper logger)
  console.error(`[${errorType}] Status: ${statusCode}`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      type: errorType,
      // Only include stack in development
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
};

export default errorHandler;