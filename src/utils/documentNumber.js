/**
 * Document Number Generator and Parser
 */

export function generateNextDocNumber(prefix = 'INV-', currentNumber = 1001) {
  const cleanPrefix = prefix ? prefix.trim() : 'INV-';
  const num = parseInt(currentNumber, 10) || 1001;
  return `${cleanPrefix}${num}`;
}

export function extractNumberFromDocNumber(docNumber, prefix = 'INV-') {
  if (!docNumber) return 1001;
  const numStr = docNumber.replace(prefix, '').replace(/[^0-9]/g, '');
  const parsed = parseInt(numStr, 10);
  return isNaN(parsed) ? 1001 : parsed;
}
