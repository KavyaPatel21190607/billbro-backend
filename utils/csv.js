function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value).replace(/"/g, '""');
  return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
}

function toCsv(rows, headers) {
  const headerKeys = headers || (rows[0] ? Object.keys(rows[0]) : []);
  const headerRow = headerKeys.join(',');
  const bodyRows = rows.map((row) => headerKeys.map((key) => escapeCsvValue(row[key])).join(','));
  return [headerRow, ...bodyRows].join('\n');
}

module.exports = { toCsv };