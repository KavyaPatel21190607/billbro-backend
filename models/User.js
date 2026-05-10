const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    businessType: { type: String, default: 'Restaurant' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    gstNumber: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    upiId: { type: String, default: '' },
    logo: { type: String, default: '' },
    googleId: { type: String, default: '' },
    smtpConfig: {
      host: { type: String, default: '' },
      port: { type: Number, default: 0 },
      user: { type: String, default: '' },
      pass: { type: String, default: '' },
    },
    awsConfig: {
      accessKeyId: { type: String, default: '' },
      secretAccessKey: { type: String, default: '' },
      region: { type: String, default: '' },
      bucketName: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);