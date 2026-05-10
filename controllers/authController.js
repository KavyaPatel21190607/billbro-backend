const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const ApiError = require('../utils/apiError');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || undefined);

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'billbro-dev-secret', { expiresIn: '30d' });
}

exports.register = async (req, res) => {
  const { companyName, ownerName, email, password, ...rest } = req.body;
  if (!companyName || !ownerName || !email || !password) throw new ApiError(400, 'Missing required fields');
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(400, 'Email already registered');
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ companyName, ownerName, email, password: hash, ...rest });
  const token = signToken(user._id);
  res.json({ token, user: { ...user.toObject(), password: undefined } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, 'Invalid credentials');
  const token = signToken(user._id);
  res.json({ token, user: { ...user.toObject(), password: undefined } });
};

exports.me = async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'billbro-dev-secret');
    const user = await User.findById(payload.userId).select('-password');
    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
};

exports.google = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new ApiError(400, 'Google token is required');

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new ApiError(401, 'Invalid Google token');

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    const randomPassword = await bcrypt.hash(`google-${payload.sub}-${Date.now()}`, 10);
    user = await User.create({
      companyName: payload.name || 'BillBro Business',
      ownerName: payload.name || 'Google User',
      email: payload.email,
      password: randomPassword,
      googleId: payload.sub || '',
      logo: payload.picture || '',
    });
  } else if (!user.googleId && payload.sub) {
    user.googleId = payload.sub;
    if (!user.logo && payload.picture) user.logo = payload.picture;
    await user.save();
  }

  const token = signToken(user._id);
  res.json({ token, user: { ...user.toObject(), password: undefined } });
};

exports.updateMe = async (req, res) => {
  const allowed = [
    'companyName',
    'ownerName',
    'businessType',
    'gstNumber',
    'phone',
    'address',
    'city',
    'state',
    'pincode',
    'upiId',
    'logo',
    'smtpConfig',
    'awsConfig',
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (req.body.password) {
    updates.password = await bcrypt.hash(req.body.password, 10);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.json({ user });
};
