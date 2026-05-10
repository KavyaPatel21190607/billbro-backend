const ApiError = require('../utils/apiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || 'Server error',
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };