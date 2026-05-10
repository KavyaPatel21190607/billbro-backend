const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const billController = require('../controllers/billController');

router.use(protect);

router.get('/', asyncHandler(billController.list));
router.get('/export.csv', asyncHandler(billController.exportCsv));
router.post('/', asyncHandler(billController.create));
router.get('/:id', asyncHandler(billController.get));
router.get('/:id/pdf', asyncHandler(billController.downloadPdf));
router.delete('/:id', asyncHandler(billController.delete));

module.exports = router;
