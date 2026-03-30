/**
 * Custom application error class
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorType - Error type categorization (default: 'Error')
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorType = 'Error') {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;