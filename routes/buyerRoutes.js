const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const buyerController = require('../controllers/buyerController');

router.use(protect);

router.get('/', asyncHandler(buyerController.list));
router.get('/export.csv', asyncHandler(buyerController.exportCsv));
router.get('/:id', asyncHandler(buyerController.get));
router.post('/', asyncHandler(buyerController.create));
router.put('/:id', asyncHandler(buyerController.update));
router.delete('/:id', asyncHandler(buyerController.delete));

module.exports = router;
