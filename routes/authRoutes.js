const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/google', asyncHandler(authController.google));
router.get('/me', asyncHandler(authController.me));
router.put('/me', protect, asyncHandler(authController.updateMe));

module.exports = router;
