function padSequence(sequence) {
  return String(sequence).padStart(4, '0');
}

function buildInvoiceNumber(sequence, date = new Date()) {
  return `INV-${date.getFullYear()}-${padSequence(sequence)}`;
}

module.exports = { buildInvoiceNumber };