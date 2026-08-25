/**
 * Utility functions for calculations in invoices, vouchers, and receipts
 */

export function calculateItemAmount(quantity, rate) {
  const q = parseFloat(quantity) || 0;
  const r = parseFloat(rate) || 0;
  return Math.max(0, q * r);
}

export function calculateTotals(items = [], discount = { type: 'percentage', value: 0 }, taxType = 'cgst_sgst', defaultTaxRate = 18, applyRoundOff = true) {
  // Subtotal from items
  const subtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return acc + (qty * rate);
  }, 0);

  // Discount calculation
  let discountAmount = 0;
  const discValue = parseFloat(discount.value as any) || 0;
  if (discount.type === 'percentage') {
    discountAmount = (subtotal * Math.min(100, Math.max(0, discValue))) / 100;
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, discValue));
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Tax calculation
  // Check if items have individual tax rates or global tax rate applies
  let totalTax = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (taxType === 'none') {
    totalTax = 0;
  } else {
    // If items specify individual tax rates
    const itemTaxSum = items.reduce((acc, item) => {
      const itemQty = parseFloat(item.quantity) || 0;
      const itemRate = parseFloat(item.rate) || 0;
      const itemSub = itemQty * itemRate;
      // Pro-rate discount to item
      const itemDisc = subtotal > 0 ? (itemSub / subtotal) * discountAmount : 0;
      const itemTaxable = Math.max(0, itemSub - itemDisc);
      const taxRate = item.taxRate !== undefined && item.taxRate !== null && item.taxRate !== '' 
        ? parseFloat(item.taxRate) || 0 
        : parseFloat(defaultTaxRate as any) || 0;
      
      return acc + (itemTaxable * taxRate) / 100;
    }, 0);

    totalTax = itemTaxSum;

    if (taxType === 'cgst_sgst') {
      cgst = totalTax / 2;
      sgst = totalTax / 2;
    } else if (taxType === 'igst') {
      igst = totalTax;
    }
  }

  const rawGrandTotal = taxableAmount + totalTax;
  
  let roundOff = 0;
  let grandTotal = rawGrandTotal;

  if (applyRoundOff) {
    const rounded = Math.round(rawGrandTotal);
    roundOff = rounded - rawGrandTotal;
    grandTotal = rounded;
  }

  return {
    subtotal: Math.max(0, subtotal),
    discountAmount: Math.max(0, discountAmount),
    taxableAmount: Math.max(0, taxableAmount),
    cgst: Math.max(0, cgst),
    sgst: Math.max(0, sgst),
    igst: Math.max(0, igst),
    totalTax: Math.max(0, totalTax),
    roundOff: parseFloat(roundOff.toFixed(2)),
    grandTotal: Math.max(0, grandTotal)
  };
}
