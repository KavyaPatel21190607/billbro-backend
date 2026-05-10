const Buyer = require('../models/Buyer');
const ApiError = require('../utils/apiError');
const { toCsv } = require('../utils/csv');

exports.list = async (req, res) => {
  const { page = 1, limit = 50, q } = req.query;
  const filter = { createdBy: req.user._id };
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ];
  }
  const items = await Buyer.find(filter).skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await Buyer.countDocuments(filter);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
};

exports.create = async (req, res) => {
  const { name, phone, email, address } = req.body;
  if (!name || !phone) throw new ApiError(400, 'Name and phone required');
  const existing = await Buyer.findOne({ createdBy: req.user._id, phone });
  if (existing) return res.status(200).json(existing);
  const buyer = await Buyer.create({ name, phone, email, address, createdBy: req.user._id });
  res.json(buyer);
};

exports.update = async (req, res) => {
  const buyer = await Buyer.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, req.body, { new: true });
  if (!buyer) throw new ApiError(404, 'Buyer not found');
  res.json(buyer);
};

exports.get = async (req, res) => {
  const buyer = await Buyer.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!buyer) throw new ApiError(404, 'Buyer not found');
  res.json(buyer);
};

exports.delete = async (req, res) => {
  const buyer = await Buyer.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!buyer) throw new ApiError(404, 'Buyer not found');
  res.json({ success: true });
};

exports.exportCsv = async (req, res) => {
  const rows = await Buyer.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
  const csvRows = rows.map((buyer) => ({
    name: buyer.name,
    phone: buyer.phone,
    email: buyer.email,
    address: buyer.address,
    totalPurchases: buyer.totalPurchases || 0,
    createdAt: buyer.createdAt,
  }));
  const csv = toCsv(csvRows, ['name', 'phone', 'email', 'address', 'totalPurchases', 'createdAt']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="buyers.csv"');
  res.send(csv);
};
