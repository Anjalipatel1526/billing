import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';
import { numberToWords } from '../utils/numberToWords';

export const UNAIBillingTemplate = ({ company = {}, customer = {}, items = [], totals = {}, document = {} }) => {
  const currencySymbol = company.currency ? company.currency.split(' ')[1] || '₹' : '₹';
  const isInvoice = document.documentType === 'invoice' || !document.documentType;
  const isVoucher = document.documentType === 'voucher';
  const isReceipt = document.documentType === 'receipt';

  // Company theme color accent (defaults to sleek orange #f97316 from reference template or company color)
  const themeColor = company.themeColor || '#f97316';

  // Orientation class: Portrait for Invoice (210mm x 297mm), Landscape for Voucher & Receipt (297mm x 210mm)
  const containerDimensions = isInvoice
    ? 'w-[210mm] min-h-[297mm] p-8'
    : 'w-[297mm] min-h-[210mm] p-8';

  return (
    <div
      id="printable-document"
      className={`bg-white text-slate-900 font-sans border border-slate-200 shadow-lg mx-auto relative flex flex-col justify-between overflow-hidden select-none ${containerDimensions}`}
    >
      {/* BACKGROUND WATERMARK OF EXACT COMPANY LOGO */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        {company.logo ? (
          <img
            src={company.logo}
            alt="Company Watermark"
            className="w-96 h-96 object-contain opacity-[0.06] grayscale contrast-200"
          />
        ) : (
          <span className="text-6xl font-black text-slate-900/5 tracking-widest uppercase rotate-[-30deg]">
            {company.companyName || 'UNAI BILLING'}
          </span>
        )}
      </div>

      {/* DOCUMENT CONTENT */}
      <div className="relative z-10 space-y-6">
        {/* TOP HEADER SECTION */}
        <div className="flex justify-between items-start">
          {/* Left: Document Title with Decorative Accent Circle */}
          <div className="relative pt-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
                {isVoucher ? (document.voucherType || 'VOUCHER') : isReceipt ? 'RECEIPT' : 'INVOICE'}
              </h1>
              {/* Decorative Theme Accent Circles (Matches reference design) */}
              <div className="flex items-center -space-x-2">
                <div
                  className="w-7 h-7 rounded-full opacity-90 shadow-2xs"
                  style={{ backgroundColor: themeColor }}
                />
                <div
                  className="w-5 h-5 rounded-full opacity-60"
                  style={{ backgroundColor: themeColor }}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              {isVoucher ? 'Voucher No' : isReceipt ? 'Receipt No' : 'Invoice No'} :{' '}
              <span className="font-mono text-slate-900 font-bold">{document.documentNumber || 'INV-1001'}</span>
            </p>
          </div>

          {/* Right: Company Logo & Contact Details */}
          <div className="text-right space-y-1">
            {company.logo ? (
              <img src={company.logo} alt="Company Logo" className="h-12 w-auto max-w-[180px] ml-auto object-contain mb-1" />
            ) : (
              <h2 className="text-xl font-bold text-slate-900" style={{ color: themeColor }}>
                {company.companyName}
              </h2>
            )}
            <p className="text-[11px] text-slate-600 font-medium">{company.phone}</p>
            <p className="text-[11px] text-slate-600">{company.email}</p>
            {company.website && <p className="text-[11px] text-slate-600">{company.website}</p>}
            <p className="text-[11px] text-slate-500 max-w-[220px] ml-auto leading-tight">{company.address}</p>
          </div>
        </div>

        {/* DETAILS GRID (Billed To & Dates) */}
        <div className="grid grid-cols-2 gap-8 pt-2">
          {/* Left: Customer Info / Paid To */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isInvoice ? 'Invoice To:' : isVoucher ? 'Paid To:' : 'Received From:'}
            </p>
            {isInvoice ? (
              <>
                <p className="text-sm font-bold text-slate-900">{customer.customerName || 'Customer Name'}</p>
                {customer.companyName && <p className="text-xs font-medium text-slate-700">{customer.companyName}</p>}
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{customer.billingAddress}</p>
                <p className="text-xs text-slate-600">
                  {[customer.state, customer.pincode].filter(Boolean).join(', ')}
                </p>
                {customer.gstNumber && (
                  <p className="text-xs font-semibold text-slate-800 mt-1">GSTIN: {customer.gstNumber}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900">{document.paidTo || document.receivedFrom || customer.customerName || 'N/A'}</p>
                {document.paymentMethod && (
                  <p className="text-xs text-slate-600 mt-1">Payment Method: <span className="font-semibold">{document.paymentMethod}</span></p>
                )}
                {document.referenceNumber && (
                  <p className="text-xs text-slate-600">Ref #: <span className="font-mono">{document.referenceNumber}</span></p>
                )}
              </>
            )}
          </div>

          {/* Right: Dates & Extra Metas */}
          <div className="text-right space-y-1 text-xs">
            <p className="text-slate-600">
              <span className="font-semibold text-slate-800">Document Date:</span> {formatDate(document.documentDate)}
            </p>
            {isInvoice && document.dueDate && (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">Due Date:</span> {formatDate(document.dueDate)}
              </p>
            )}
            {company.gstNumber && (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">GSTIN:</span> {company.gstNumber}
              </p>
            )}
            {company.panNumber && (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">PAN:</span> {company.panNumber}
              </p>
            )}
          </div>
        </div>

        {/* ITEM TABLE (For Invoice) */}
        {isInvoice && (
          <div className="overflow-hidden border-b border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-2 w-12">No.</th>
                  <th className="py-2.5 px-2">Product Description</th>
                  <th className="py-2.5 px-2 text-right">Price ({currencySymbol})</th>
                  <th className="py-2.5 px-2 text-right w-16">QTY</th>
                  <th className="py-2.5 px-2 text-right w-28">Total ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No items added to invoice
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 text-slate-500 font-medium">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        {item.description && <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-700 font-medium">
                        {formatCurrency(item.rate, '').trim()}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {String(item.quantity).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900">
                        {formatCurrency(item.quantity * item.rate, '').trim()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VOUCHER / RECEIPT SPECIFIC BLOCK */}
        {(isVoucher || isReceipt) && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Transaction Particulars</h4>
            <p className="text-slate-800 leading-relaxed">{document.description || document.notes || 'N/A'}</p>
            <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-2">
              <span className="font-bold text-slate-700">Total Amount:</span>
              <span className="text-base font-bold text-slate-900">{formatCurrency(totals.grandTotal || document.amount || 0, currencySymbol)}</span>
            </div>
          </div>
        )}

        {/* PAYMENT METHOD, TERMS, & TOTALS SUMMARY */}
        <div className="grid grid-cols-2 gap-8 pt-2">
          {/* Left: Payment Method & Terms */}
          <div className="space-y-4 text-xs">
            {company.bankDetails?.accountNumber && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">Payment Method</h4>
                <div className="text-slate-600 space-y-0.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p>Bank Account: <span className="font-mono font-semibold text-slate-800">{company.bankDetails.accountNumber}</span></p>
                  <p>Bank: <span className="font-semibold text-slate-800">{company.bankDetails.bankName}</span> (IFSC: {company.bankDetails.ifsc})</p>
                  {company.bankDetails.upiId && (
                    <p>UPI ID: <span className="font-mono font-semibold text-slate-800">{company.bankDetails.upiId}</span></p>
                  )}
                </div>
              </div>
            )}

            {(document.paymentTerms || company.paymentTerms || document.notes) && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">Terms & Condition</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  {document.paymentTerms || company.paymentTerms || document.notes}
                </p>
              </div>
            )}

            {/* Amount in Words */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
              <span className="font-bold text-slate-800">Amount in Words: </span>
              <span className="font-semibold text-slate-900">{numberToWords(totals.grandTotal || document.amount || 0, currencySymbol)}</span>
            </div>
          </div>

          {/* Right: Subtotal, Taxes, Grand Total & Signature */}
          <div className="space-y-4 text-right text-xs">
            {isInvoice && (
              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <div className="flex justify-between text-slate-600">
                  <span>Sub Total</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal, currencySymbol)}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount</span>
                    <span className="font-semibold text-emerald-600">-{formatCurrency(totals.discountAmount, currencySymbol)}</span>
                  </div>
                )}

                {totals.cgst > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>CGST</span>
                    <span>{formatCurrency(totals.cgst, currencySymbol)}</span>
                  </div>
                )}

                {totals.sgst > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>SGST</span>
                    <span>{formatCurrency(totals.sgst, currencySymbol)}</span>
                  </div>
                )}

                {totals.igst > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST</span>
                    <span>{formatCurrency(totals.igst, currencySymbol)}</span>
                  </div>
                )}

                {totals.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Round Off</span>
                    <span>{formatCurrency(totals.roundOff, currencySymbol)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-300 pt-2 mt-1">
                  <span>Total</span>
                  <span style={{ color: themeColor }}>{formatCurrency(totals.grandTotal, currencySymbol)}</span>
                </div>
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-2 ml-auto inline-block text-right">
              {document.signature ? (
                <img src={document.signature} alt="Signature" className="h-12 w-auto ml-auto mb-1 object-contain" />
              ) : (
                <div className="h-12"></div>
              )}
              <p className="font-bold text-slate-900 text-xs">
                {company.companyName || 'Authorized Officer'}
              </p>
              <p className="text-[10px] text-slate-500">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BANNER & DECORATIVE ACCENTS */}
      <div className="relative z-10 pt-6 mt-auto border-t border-slate-100 flex items-center justify-between">
        <div className="text-[10px] text-slate-400 space-y-0.5">
          <p className="font-semibold text-slate-700">{company.phone} | {company.email}</p>
          <p>{company.address}</p>
        </div>

        {/* Thank You Pill Tag & Decorative Theme Circle Accent (Matches reference image) */}
        <div className="flex items-center gap-3">
          <div
            className="px-5 py-2 rounded-full font-bold text-white text-xs shadow-xs"
            style={{ backgroundColor: themeColor }}
          >
            Thank you for your Business!
          </div>

          {/* Bottom Right Decorative Circle */}
          <div
            className="w-10 h-10 rounded-full opacity-80 shrink-0"
            style={{ backgroundColor: themeColor }}
          />
        </div>
      </div>
    </div>
  );
};
