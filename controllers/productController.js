const Product = require('../models/Product');
const ApiError = require('../utils/apiError');

exports.list = async (req, res) => {
  const { q, category, page = 1, limit = 100 } = req.query;
  const filter = {};
  if (q) filter.name = new RegExp(q, 'i');
  if (category) filter.category = category;
  const items = await Product.find(filter).skip((page - 1) * limit).limit(Number(limit)).sort({ name: 1 });
  const total = await Product.countDocuments(filter);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
};

exports.create = async (req, res) => {
  const { name, category, price, gstRate, stock, description } = req.body;
  if (!name || !category || price == null || gstRate == null) throw new ApiError(400, 'Missing fields');
  const product = await Product.create({ name, category, price, gstRate, stock, description, createdBy: req.user._id });
  res.json(product);
};

exports.update = async (req, res) => {
  const product = await Product.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
};

exports.get = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
};

exports.delete = async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true });
};

