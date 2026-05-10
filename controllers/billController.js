const Bill = require('../models/Bill');
const Buyer = require('../models/Buyer');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { createInvoicePdf } = require('../services/pdf.service');
const { uploadPdfToCloud } = require('../services/storage.service');
const { sendInvoiceEmail } = require('../services/email.service');
const { toCsv } = require('../utils/csv');

exports.list = async (req, res) => {
  const { page = 1, limit = 50, q, paymentMethod, paymentStatus } = req.query;
  const filter = { createdBy: req.user._id };
  if (q) filter.invoiceNumber = new RegExp(q, 'i');
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  const items = await Bill.find(filter).skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await Bill.countDocuments(filter);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
};

exports.create = async (req, res) => {
  const { customerId, customer, items, paymentMethod } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Missing items data');

  let buyer = null;
  if (customerId) {
    buyer = await Buyer.findOne({ _id: customerId, createdBy: req.user._id });
  }

  if (!buyer && customer && customer.phone) {
    buyer = await Buyer.findOne({ phone: customer.phone, createdBy: req.user._id });
    if (!buyer) {
      buyer = await Buyer.create({
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        createdBy: req.user._id,
      });
    }
  }

  if (!buyer) throw new ApiError(400, 'Customer details are required');

  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  const processedItems = [];

  for (const it of items) {
    const product = it.productId ? await Product.findById(it.productId) : null;
    const name = product ? product.name : it.name;
    const category = product ? product.category : it.category || 'General';
    const price = product ? product.price : it.price;
    const quantity = it.quantity || 1;
    const discount = it.discount || 0;
    const base = price * quantity;
    const discounted = base - (base * discount) / 100;
    const gst = (discounted * (product ? product.gstRate : it.gstRate || 5)) / 100;
    const half = gst / 2;

    processedItems.push({
      productId: product ? product._id : null,
      name,
      category,
      price,
      quantity,
      discount,
      gstRate: product ? product.gstRate : it.gstRate || 5,
      cgst: half,
      sgst: half,
      igst: 0,
      total: discounted + gst,
    });

    subtotal += discounted;
    cgst += half;
    sgst += half;
  }

  const total = subtotal + cgst + sgst + igst;
  const lastSeq = (await Bill.countDocuments({ createdBy: req.user._id })) + 1;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(lastSeq).padStart(4, '0')}`;

  const bill = await Bill.create({
    invoiceNumber,
    customerId: buyer._id,
    customerSnapshot: { name: buyer.name, phone: buyer.phone, email: buyer.email, address: buyer.address },
    items: processedItems,
    subtotal,
    cgst,
    sgst,
    igst,
    total,
    paymentMethod: paymentMethod || 'Cash',
    paymentStatus: 'Paid',
    createdBy: req.user._id,
  });

  const { buffer, fileName } = await createInvoicePdf({ bill, buyer, company: req.user });
  const cloud = await uploadPdfToCloud({ buffer, fileName });
  bill.pdfUrl = cloud.url;
  await bill.save();

  if (buyer && buyer._id) {
    await Buyer.findByIdAndUpdate(buyer._id, { $inc: { totalPurchases: 1 } });
  }

  try {
    await sendInvoiceEmail({ to: buyer.email, companyName: req.user.companyName, invoiceNumber: bill.invoiceNumber, amount: bill.total, pdfBuffer: buffer, pdfName: fileName });
    bill.emailStatus = 'Sent';
    await bill.save();
  } catch (err) {}

  res.json(bill);
};

exports.get = async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!bill) throw new ApiError(404, 'Bill not found');
  res.json(bill);
};

exports.delete = async (req, res) => {
  const bill = await Bill.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!bill) {
    return res.status(404).json({ message: 'Bill not found' });
  }

  res.json({ message: 'Bill removed' });
};

exports.downloadPdf = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!bill || !bill.pdfUrl) return res.status(404).json({ message: 'PDF not found' });

    const fileName = bill.pdfUrl.split('/').pop();
    
    if (bill.pdfUrl.includes('amazonaws.com')) {
      const { getPdfStreamFromCloud } = require('../services/storage.service');
      const stream = await getPdfStreamFromCloud(fileName);
      
      if (!stream) {
        return res.status(404).json({ message: 'Could not fetch file from cloud' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      stream.pipe(res);
    } else {
      const path = require('path');
      const filePath = path.join(process.cwd(), 'backend', 'uploads', 'cloud', fileName);
      res.download(filePath, fileName);
    }
  } catch (error) {
    console.error('Download PDF Error:', error);
    res.status(500).json({ message: 'Error downloading PDF' });
  }
};

exports.exportCsv = async (req, res) => {
  const rows = await Bill.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
  const csvRows = rows.map((bill) => ({
    invoiceNumber: bill.invoiceNumber,
    customerName: bill.customerSnapshot?.name || '',
    customerPhone: bill.customerSnapshot?.phone || '',
    total: bill.total,
    paymentMethod: bill.paymentMethod,
    paymentStatus: bill.paymentStatus,
    createdAt: bill.createdAt,
    pdfUrl: bill.pdfUrl || '',
  }));
  const csv = toCsv(csvRows, ['invoiceNumber', 'customerName', 'customerPhone', 'total', 'paymentMethod', 'paymentStatus', 'createdAt', 'pdfUrl']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bills.csv"');
  res.send(csv);
};
