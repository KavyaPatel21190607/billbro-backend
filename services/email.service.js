const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendInvoiceEmail({ to, companyName, invoiceNumber, amount, pdfBuffer, pdfName }) {
  const transporter = createTransport();
  if (!transporter || !to) {
    return { skipped: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Invoice ${invoiceNumber} from ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a">
        <h2 style="margin-bottom:8px">${companyName}</h2>
        <p style="margin:0 0 12px">Your invoice ${invoiceNumber} is attached.</p>
        <p style="margin:0 0 12px"><strong>Total:</strong> ₹${amount.toFixed(2)}</p>
        <p style="margin:0;color:#64748b">Thank you for your business.</p>
      </div>
    `,
    attachments: [
      {
        filename: pdfName,
        content: pdfBuffer,
      },
    ],
  });

  return { skipped: false };
}

module.exports = { sendInvoiceEmail };