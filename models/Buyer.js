const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    address: { type: String, default: '' },
    totalPurchases: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

buyerSchema.index({ createdBy: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Buyer', buyerSchema);