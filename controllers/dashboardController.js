const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Buyer = require('../models/Buyer');

exports.summary = async (req, res) => {
  const createdBy = req.user._id;
  const totalRevenueAgg = await Bill.aggregate([
    { $match: { createdBy } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);

  const monthly = await Bill.aggregate([
    { $match: { createdBy } },
    { $addFields: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } } },
    { $group: { _id: '$month', total: { $sum: '$total' } } },
    { $sort: { _id: 1 } },
  ]);

  const paymentTypes = await Bill.aggregate([
    { $match: { createdBy } },
    { $group: { _id: '$paymentMethod', total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);

  const buyerCount = await Buyer.countDocuments({ createdBy });

  const recentBills = await Bill.find({ createdBy })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('invoiceNumber customerSnapshot total paymentStatus createdAt paymentMethod');

  const topProducts = await Product.aggregate([
    { $match: { createdBy } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    totalRevenue: totalRevenueAgg[0] || { total: 0, count: 0 },
    totalBuyers: buyerCount,
    monthly,
    paymentTypes,
    topProducts,
    recentBills,
  });
};
