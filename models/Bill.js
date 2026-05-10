const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    gstRate: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    items: { type: [billItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Online'], required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    pdfUrl: { type: String, default: '' },
    emailStatus: { type: String, default: 'Not Sent' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

billSchema.index({ createdBy: 1, createdAt: -1 });
billSchema.index({ createdBy: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
