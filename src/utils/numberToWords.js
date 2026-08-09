/**
 * Converts a number to words in the Indian numbering system (Lakhs, Crores, Thousands)
 * Example: 11800 -> "Rupees Eleven Thousand Eight Hundred Only"
 * Example: 125000.50 -> "Rupees One Lakh Twenty-Five Thousand Fifty Paise Only"
 */

const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const twoDigits = ['', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanThousand(num) {
  let str = '';
  if (num >= 100) {
    str += singleDigits[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 10 && num <= 19) {
    str += twoDigits[num - 9] + ' ';
  } else {
    if (num >= 20) {
      str += tensMultiple[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += singleDigits[num] + ' ';
    }
  }
  return str;
}

export function numberToWords(amount, currencySymbol = 'INR') {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rupees Zero Only';
  const numVal = parseFloat(amount);
  if (numVal === 0) return 'Rupees Zero Only';

  const absNum = Math.abs(numVal);
  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  let words = '';

  let crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + 'Thousand ';
  }
  if (remainder > 0) {
    words += convertLessThanThousand(remainder);
  }

  words = words.trim();

  let currencyPrefix = 'Rupees';
  if (currencySymbol.includes('$') || currencySymbol === 'USD') currencyPrefix = 'Dollars';
  else if (currencySymbol.includes('€') || currencySymbol === 'EUR') currencyPrefix = 'Euros';
  else if (currencySymbol.includes('£') || currencySymbol === 'GBP') currencyPrefix = 'Pounds';

  let result = `${currencyPrefix} ${words}`;

  if (decimalPart > 0) {
    let paiseStr = convertLessThanThousand(decimalPart).trim();
    let subUnit = currencyPrefix === 'Rupees' ? 'Paise' : 'Cents';
    result += ` and ${paiseStr} ${subUnit}`;
  }

  result += ' Only';
  return result;
}
