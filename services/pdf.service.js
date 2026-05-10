const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

function ensureUploadsDir() {
  const uploadDir = path.join(process.cwd(), 'backend', 'uploads', 'invoices');
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function createInvoicePdf({ bill, buyer, company, invoiceDate = new Date() }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const bufferPromise = streamToBuffer(doc);
  const uploadDir = ensureUploadsDir();
  const filePath = path.join(uploadDir, `${bill.invoiceNumber}.pdf`);
  const fileStream = fs.createWriteStream(filePath);

  doc.pipe(fileStream);

  doc.fontSize(22).fillColor('#0f172a').text(company.companyName || 'BillBro', { align: 'left' });
  doc.fontSize(10).fillColor('#475569').text(company.address || '', { align: 'left' });
  doc.text(`GST: ${company.gstNumber || '-'}`);
  doc.text(`UPI: ${company.upiId || '-'}`);
  doc.moveDown(0.5);

  doc.fontSize(18).fillColor('#0f172a').text('GST Tax Invoice', { align: 'right' });
  doc.fontSize(10).fillColor('#475569').text(`Invoice #: ${bill.invoiceNumber}`, { align: 'right' });
  doc.text(`Date: ${invoiceDate.toLocaleDateString('en-IN')}`, { align: 'right' });

  doc.moveDown();
  doc.rect(40, 160, 370, 78).stroke('#cbd5e1');
  doc.fontSize(12).fillColor('#0f172a').text('Billed To', 50, 170);
  doc.fontSize(10).fillColor('#334155').text(buyer.name, 50, 188);
  doc.text(buyer.phone, 50, 202);
  doc.text(buyer.email || '-', 50, 216);
  doc.text(buyer.address || '-', 250, 188, { width: 150 });

  const qrPayload = `upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.companyName)}&am=${bill.total.toFixed(2)}&cu=INR`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload);

  doc.roundedRect(430, 160, 78, 78, 8).stroke('#cbd5e1');
  doc.image(qrDataUrl, 434, 164, { fit: [70, 70] });
  doc.fontSize(8).fillColor('#64748b').text('Scan to Pay', 430, 245, { width: 78, align: 'center' });

  const tableTop = 270;
  const tableHeaders = ['Item', 'Qty', 'Rate', 'Disc%', 'GST', 'Total'];
  const colX = [50, 260, 310, 380, 440, 490];

  doc.fontSize(10).fillColor('#0f172a');
  doc.text('Item', colX[0], tableTop, { align: 'left' });
  doc.text('Qty', colX[1], tableTop, { width: 40, align: 'right' });
  doc.text('Rate', colX[2], tableTop, { width: 60, align: 'right' });
  doc.text('Disc%', colX[3], tableTop, { width: 50, align: 'right' });
  doc.text('GST', colX[4], tableTop, { width: 50, align: 'right' });
  doc.text('Total', colX[5], tableTop, { width: 60, align: 'right' });
  doc.moveTo(40, tableTop + 14).lineTo(555, tableTop + 14).stroke('#cbd5e1');

  let rowY = tableTop + 24;
  bill.items.forEach((item) => {
    doc.text(item.name.slice(0, 30), colX[0], rowY, { width: 200, align: 'left' });
    doc.text(String(item.quantity), colX[1], rowY, { width: 40, align: 'right' });
    doc.text(`${item.price.toFixed(2)}`, colX[2], rowY, { width: 60, align: 'right' });
    doc.text(`${item.discount}%`, colX[3], rowY, { width: 50, align: 'right' });
    doc.text(`${(item.cgst + item.sgst + item.igst).toFixed(2)}`, colX[4], rowY, { width: 50, align: 'right' });
    doc.text(`${item.total.toFixed(2)}`, colX[5], rowY, { width: 60, align: 'right' });
    rowY += 20;
  });

  const summaryY = Math.max(rowY + 20, 400);
  doc.moveTo(40, summaryY).lineTo(555, summaryY).stroke('#cbd5e1');

  doc.fontSize(11).fillColor('#0f172a');
  doc.text(`Payment Method: ${bill.paymentMethod || 'Cash'}`, 40, summaryY + 12);
  
  doc.fontSize(14).fillColor('#16a34a');
  doc.text(`Status: PAID`, 40, summaryY + 30);

  doc.fontSize(11).fillColor('#334155');
  doc.text(`Subtotal: ${bill.subtotal.toFixed(2)}`, 330, summaryY + 12, { width: 220, align: 'right' });
  doc.text(`CGST: ${bill.cgst.toFixed(2)}`, 330, summaryY + 30, { width: 220, align: 'right' });
  doc.text(`SGST: ${bill.sgst.toFixed(2)}`, 330, summaryY + 48, { width: 220, align: 'right' });
  doc.text(`IGST: ${bill.igst.toFixed(2)}`, 330, summaryY + 66, { width: 220, align: 'right' });
  doc.fontSize(13).fillColor('#0f172a').text(`Total Payable: ${bill.total.toFixed(2)}`, 330, summaryY + 90, { width: 220, align: 'right' });

  doc.moveDown(4);
  doc.fontSize(9).fillColor('#64748b').text('Thank you for your business. This is a computer-generated invoice.', 40, 710, {
    align: 'center',
  });
  doc.text('Authorized Signature', 410, 690, { width: 140, align: 'center' });
  doc.moveTo(420, 735).lineTo(540, 735).stroke('#94a3b8');

  doc.end();

  const buffer = await bufferPromise;
  return {
    buffer,
    filePath,
    fileName: `${bill.invoiceNumber}.pdf`,
  };
}

module.exports = { createInvoicePdf };