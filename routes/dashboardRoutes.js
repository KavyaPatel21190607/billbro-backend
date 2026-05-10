const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(protect);

router.get('/summary', asyncHandler(dashboardController.summary));

module.exports = router;
