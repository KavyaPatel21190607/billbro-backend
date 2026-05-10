const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const productController = require('../controllers/productController');

router.use(protect);

router.get('/', asyncHandler(productController.list));
router.get('/:id', asyncHandler(productController.get));
router.post('/', asyncHandler(productController.create));
router.put('/:id', asyncHandler(productController.update));
router.delete('/:id', asyncHandler(productController.delete));

module.exports = router;
