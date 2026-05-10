const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, required: true, min: 0, max: 28 },
    stock: { type: Number, default: 0 },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

productSchema.index({ createdBy: 1, name: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);