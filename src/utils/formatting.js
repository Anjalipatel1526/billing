/**
 * Formatting and validation helper functions
 */

export function formatCurrency(amount, symbol = '₹') {
  if (amount === undefined || amount === null || isNaN(amount)) return `${symbol}0.00`;
  const val = parseFloat(amount);
  return `${symbol}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function validateEmail(email) {
  if (!email) return true; // Optional field
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateGST(gst) {
  if (!gst) return true; // Optional field
  // Standard Indian GSTIN regex pattern (15 characters)
  const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return re.test(gst.toUpperCase().trim());
}

export function validatePAN(pan) {
  if (!pan) return true; // Optional field
  // Standard Indian PAN regex pattern (10 characters)
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return re.test(pan.toUpperCase().trim());
}
