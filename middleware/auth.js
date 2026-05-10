const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

async function protect(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Not authenticated'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'billbro-dev-secret');
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return next(new ApiError(401, 'Invalid session'));
    }
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { protect };