import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { ItemTable } from '../components/documents/ItemTable';
import { TemplateWrapper, TEMPLATES_CONFIG } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { numberToWords } from '../utils/numberToWords';
import { generateNextDocNumber } from '../utils/documentNumber';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { validateEmail, validateGST } from '../utils/formatting';
import { Save, Download, FileText, CreditCard, Receipt, Eye, Edit3, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const CreateDocument = () => {
  const { activeCompany } = useCompany();
  const { saveDoc, documents } = useDocument();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const previewRef = useRef(null);

  // Document Type: invoice | voucher | receipt
  const typeParam = searchParams.get('type') || 'invoice';

  // Mobile View Switcher: 'edit' | 'preview'
  const [activeTab, setActiveTab] = useState('edit');

  // Form State
  const [docType, setDocType] = useState(typeParam);
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
  const [status, setStatus] = useState('Pending');
  const [selectedTemplate, setSelectedTemplate] = useState(activeCompany?.selectedTemplate || 'UNAI Billing');

  // Customer Details (For Invoice)
  const [customer, setCustomer] = useState({
    customerName: '',
    companyName: '',
    gstNumber: '',
    email: '',
    phone: '',
    billingAddress: '',
    shippingAddress: '',
    sameAsBilling: true,
    state: '',
    pincode: ''
  });

  // Items (For Invoice)
  const [items, setItems] = useState([
    { id: 'item_1', name: '', description: '', quantity: 1, rate: 0, taxRate: activeCompany?.defaultTax || 18 }
  ]);

  // Discount & Tax Options
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
  const [taxType, setTaxType] = useState('cgst_sgst'); // cgst_sgst | igst | single_tax | none
  const [applyRoundOff, setApplyRoundOff] = useState(true);

  // Voucher / Receipt specifics
  const [voucherType, setVoucherType] = useState('Payment Voucher');
  const [paidTo, setPaidTo] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');

  // Signature & Notes
  const [notes, setNotes] = useState(activeCompany?.notes || '');
  const [paymentTerms, setPaymentTerms] = useState(activeCompany?.paymentTerms || '');
  const [signature, setSignature] = useState('');

  const [errors, setErrors] = useState({});

  // Initialize or load existing doc
  useEffect(() => {
    if (id) {
      const existing = documents.find(d => d.id === id);
      if (existing) {
        setDocType(existing.documentType || 'invoice');
        setDocumentNumber(existing.documentNumber || '');
        setDocumentDate(existing.documentDate || new Date().toISOString().slice(0, 10));
        setDueDate(existing.dueDate || new Date().toISOString().slice(0, 10));
        setStatus(existing.status || 'Pending');
        setSelectedTemplate(existing.template || activeCompany?.selectedTemplate || 'UNAI Billing');
        if (existing.customer) setCustomer(existing.customer);
        if (existing.items) setItems(existing.items);
        if (existing.discount) setDiscount(existing.discount);
        if (existing.taxType) setTaxType(existing.taxType);
        if (existing.voucherType) setVoucherType(existing.voucherType);
        if (existing.paidTo) setPaidTo(existing.paidTo);
        if (existing.receivedFrom) setReceivedFrom(existing.receivedFrom);
        if (existing.amount) setAmount(existing.amount);
        if (existing.paymentMethod) setPaymentMethod(existing.paymentMethod);
        if (existing.referenceNumber) setReferenceNumber(existing.referenceNumber);
        if (existing.description) setDescription(existing.description);
        if (existing.notes) setNotes(existing.notes);
        if (existing.paymentTerms) setPaymentTerms(existing.paymentTerms);
        if (existing.signature) setSignature(existing.signature);
      }
    } else {
      // Auto-generate number for new document
      let num = '';
      if (docType === 'voucher') {
        num = generateNextDocNumber(activeCompany?.voucherPrefix || 'VCH-', activeCompany?.voucherStartNumber || 1001);
      } else if (docType === 'receipt') {
        num = generateNextDocNumber(activeCompany?.receiptPrefix || 'REC-', activeCompany?.receiptStartNumber || 1001);
      } else {
        num = generateNextDocNumber(activeCompany?.invoicePrefix || 'INV-', activeCompany?.invoiceStartNumber || 1001);
      }
      setDocumentNumber(num);
    }
  }, [id, docType, activeCompany, documents]);

  // Recalculate Totals
  const totals = useMemo(() => {
    if (docType === 'invoice') {
      return calculateTotals(items, discount, taxType, activeCompany?.defaultTax || 18, applyRoundOff);
    } else {
      const numAmt = parseFloat(amount) || 0;
      return {
        subtotal: numAmt,
        discountAmount: 0,
        taxableAmount: numAmt,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: numAmt
      };
    }
  }, [items, discount, taxType, activeCompany?.defaultTax, applyRoundOff, docType, amount]);

  // Amount in Words
  const amountWords = useMemo(() => {
    const currencySymbol = activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';
    return numberToWords(totals.grandTotal, currencySymbol);
  }, [totals.grandTotal, activeCompany?.currency]);

  // Validation
  const validateForm = () => {
    const errs = {};
    if (docType === 'invoice') {
      if (!customer.customerName.trim()) errs.customerName = 'Customer Name is required.';
      if (customer.email && !validateEmail(customer.email)) errs.customerEmail = 'Invalid email address.';
      if (customer.gstNumber && !validateGST(customer.gstNumber)) errs.customerGst = 'Invalid GSTIN format.';
      if (items.length === 0) errs.items = 'At least one item is required.';
      else {
        items.forEach((item, idx) => {
          if (!item.name.trim()) errs[`item_${idx}_name`] = 'Item name is required.';
          if (item.quantity <= 0) errs[`item_${idx}_qty`] = 'Qty must be > 0.';
        });
      }
    } else if (docType === 'voucher') {
      if (!paidTo.trim()) errs.paidTo = 'Paid To field is required.';
      if (amount <= 0) errs.amount = 'Amount must be greater than zero.';
    } else if (docType === 'receipt') {
      if (!receivedFrom.trim()) errs.receivedFrom = 'Received From field is required.';
      if (amount <= 0) errs.amount = 'Amount must be greater than zero.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Please fix the form errors before saving.', 'error');
      return;
    }

    try {
      const payload = {
        id,
        documentType: docType,
        documentNumber,
        documentDate,
        dueDate,
        status,
        template: selectedTemplate,
        customer,
        items,
        discount,
        taxType,
        totals,
        voucherType,
        paidTo,
        receivedFrom,
        amount,
        paymentMethod,
        referenceNumber,
        description,
        notes,
        paymentTerms,
        signature
      };

      const saved = await saveDoc(payload);
      showToast(`Document ${saved.documentNumber} saved successfully!`, 'success');
      navigate('/documents');
    } catch (err) {
      console.error(err);
      showToast('Failed to save document.', 'error');
    }
  };

  const handleDownload = async () => {
    if (!validateForm()) {
      showToast('Please complete required fields before downloading.', 'error');
      return;
    }

    showToast('Generating high quality PDF...', 'info');
    try {
      if (previewRef.current) {
        const clientName = customer.customerName || paidTo || receivedFrom || 'Client';
        const filename = `${documentNumber}-${clientName.replace(/\s+/g, '_')}`;
        const orientation = docType === 'invoice' ? 'portrait' : 'landscape';
        await downloadDocumentPDF(previewRef.current, filename, orientation);
        showToast('PDF downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF.', 'error');
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setSignature(evt.target.result);
    reader.readAsDataURL(file);
  };

  const docObject = useMemo(() => ({
    documentType: docType,
    documentNumber,
    documentDate,
    dueDate,
    status,
    voucherType,
    paidTo,
    receivedFrom,
    amount,
    paymentMethod,
    referenceNumber,
    description,
    notes,
    paymentTerms,
    signature
  }), [docType, documentNumber, documentDate, dueDate, status, voucherType, paidTo, receivedFrom, amount, paymentMethod, referenceNumber, description, notes, paymentTerms, signature]);

  return (
    <MainLayout title={id ? `Edit Document ${documentNumber}` : 'Create Document'}>
      <div className="space-y-4">
        {/* Top Navigation & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/documents')}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-sm md:text-base">
                {id ? `Edit ${docType.toUpperCase()}` : `New ${docType.toUpperCase()}`}
              </h1>
              <p className="text-[11px] text-slate-500">Live preview updates instantly as you type. Invoices are Portrait; Vouchers & Receipts are Landscape.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Save} onClick={handleSave}>
              Save Document
            </Button>
            <Button icon={Download} onClick={handleDownload}>
              Download PDF
            </Button>
          </div>
        </div>

        {/* Mobile Editor / Preview Tab Switcher */}
        <div className="flex lg:hidden bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Form Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Editor & Preview Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: FORM EDITOR */}
          <div className={`space-y-6 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs ${
            activeTab === 'edit' ? 'block' : 'hidden lg:block'
          }`}>
            {/* Document Type Selector Tabs */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">Document Type</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'invoice', label: 'Invoice', icon: FileText },
                  { id: 'voucher', label: 'Voucher', icon: CreditCard },
                  { id: 'receipt', label: 'Receipt', icon: Receipt }
                ].map((t) => {
                  const Icon = t.icon;
                  const isSel = docType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDocType(t.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        isSel ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Numbers & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Document Number"
                required
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />

              <Input
                label="Document Date"
                type="date"
                required
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />

              {docType === 'invoice' && (
                <Input
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              )}

              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Draft">Draft</option>
              </Select>
            </div>

            {/* Template Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">Template Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATES_CONFIG.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                      selectedTemplate === t.id
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* INVOICE CUSTOMER FORM */}
            {docType === 'invoice' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Customer Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Customer Name"
                    required
                    placeholder="John Doe / TechCorp"
                    value={customer.customerName}
                    onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
                    error={errors.customerName}
                  />

                  <Input
                    label="Company Name"
                    placeholder="TechCorp Solutions"
                    value={customer.companyName}
                    onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="GSTIN"
                    placeholder="27ABCDE1234F1Z5"
                    value={customer.gstNumber}
                    onChange={(e) => setCustomer({ ...customer, gstNumber: e.target.value.toUpperCase() })}
                    error={errors.customerGst}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="client@techcorp.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    error={errors.customerEmail}
                  />
                  <Input
                    label="Phone"
                    placeholder="+91 98765 43210"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>

                <Input
                  label="Billing Address"
                  placeholder="Street address, Suite"
                  value={customer.billingAddress}
                  onChange={(e) => setCustomer({ ...customer, billingAddress: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="State"
                    placeholder="Maharashtra"
                    value={customer.state}
                    onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                  />
                  <Input
                    label="Pincode"
                    placeholder="400001"
                    value={customer.pincode}
                    onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameShipping"
                    checked={customer.sameAsBilling}
                    onChange={(e) => setCustomer({ ...customer, sameAsBilling: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="sameShipping" className="text-xs text-slate-600">
                    Shipping address same as billing
                  </label>
                </div>

                {!customer.sameAsBilling && (
                  <Input
                    label="Shipping Address"
                    placeholder="Separate shipping destination"
                    value={customer.shippingAddress}
                    onChange={(e) => setCustomer({ ...customer, shippingAddress: e.target.value })}
                  />
                )}
              </div>
            )}

            {/* INVOICE ITEM TABLE */}
            {docType === 'invoice' && (
              <div className="pt-4 border-t border-slate-100">
                <ItemTable
                  items={items}
                  onChange={setItems}
                  defaultTax={activeCompany?.defaultTax || 18}
                  currencySymbol={activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹'}
                />
                {errors.items && <p className="text-[11px] text-rose-500 mt-1">{errors.items}</p>}
              </div>
            )}

            {/* TAX & DISCOUNT OPTIONS FOR INVOICE */}
            {docType === 'invoice' && (
              <div className="pt-4 border-t border-slate-100 space-y-4 bg-slate-50 p-4 rounded-xl">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Tax & Discount Adjustments</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Tax Calculation Mode"
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value)}
                  >
                    <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                    <option value="igst">IGST (Inter-state)</option>
                    <option value="single_tax">Single Tax Rate</option>
                    <option value="none">No Tax / Zero Tax</option>
                  </Select>

                  <Select
                    label="Discount Type"
                    value={discount.type}
                    onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ({activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹'})</option>
                  </Select>

                  <Input
                    label="Discount Value"
                    type="number"
                    min="0"
                    value={discount.value}
                    onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="roundOff"
                    checked={applyRoundOff}
                    onChange={(e) => setApplyRoundOff(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="roundOff" className="text-xs text-slate-600">
                    Apply automatic round off to grand total
                  </label>
                </div>
              </div>
            )}

            {/* VOUCHER / RECEIPT SPECIFIC FORM */}
            {(docType === 'voucher' || docType === 'receipt') && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  {docType === 'voucher' ? 'Voucher Particulars' : 'Receipt Particulars'}
                </h3>

                {docType === 'voucher' && (
                  <Select
                    label="Voucher Category"
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value)}
                  >
                    <option value="Payment Voucher">Payment Voucher</option>
                    <option value="Receipt Voucher">Receipt Voucher</option>
                    <option value="Expense Voucher">Expense Voucher</option>
                    <option value="General Voucher">General Voucher</option>
                  </Select>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docType === 'voucher' ? (
                    <Input
                      label="Paid To / Beneficiary"
                      required
                      placeholder="Vendor / Employee Name"
                      value={paidTo}
                      onChange={(e) => setPaidTo(e.target.value)}
                      error={errors.paidTo}
                    />
                  ) : (
                    <Input
                      label="Received From"
                      required
                      placeholder="Customer Name"
                      value={receivedFrom}
                      onChange={(e) => setReceivedFrom(e.target.value)}
                      error={errors.receivedFrom}
                    />
                  )}

                  <Input
                    label="Total Amount"
                    type="number"
                    required
                    min="0"
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    error={errors.amount}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI Direct">UPI Direct</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit / Debit Card</option>
                  </Select>

                  <Input
                    label="Reference / Transaction #"
                    placeholder="e.g. UTR12345678"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>

                <Input
                  label="Description / Purpose"
                  placeholder="Reason for payment or transaction notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}

            {/* SIGNATURE & NOTES */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Notes & Authorized Signature</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Document Notes"
                  placeholder="Additional notes for the client"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Input
                  label="Payment Terms"
                  placeholder="Terms & Conditions"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Authorized Signature Image</label>
                {signature ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border rounded-lg w-fit">
                    <img src={signature} alt="Signature preview" className="h-10 w-auto object-contain" />
                    <button
                      type="button"
                      onClick={() => setSignature('')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove Signature
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-xs text-blue-600 border border-slate-200 hover:bg-slate-50 p-2.5 rounded-lg cursor-pointer w-fit">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Signature Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSignatureUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE A4 PREVIEW */}
          <div className={`space-y-3 sticky top-20 ${
            activeTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-xs">Live A4 Document Preview ({docType === 'invoice' ? 'Portrait' : 'Landscape'})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Template: {selectedTemplate}</span>
            </div>

            {/* Printable A4 Canvas Wrapper */}
            <div className="bg-slate-200/70 p-4 md:p-6 rounded-2xl border border-slate-300 overflow-x-auto shadow-inner flex justify-center">
              <div className={`transform origin-top transition-all ${
                docType === 'invoice' ? 'scale-[0.80] sm:scale-[0.85]' : 'scale-[0.60] sm:scale-[0.68]'
              }`}>
                <div ref={previewRef}>
                  <TemplateWrapper
                    templateName={selectedTemplate}
                    company={activeCompany}
                    customer={customer}
                    items={items}
                    totals={totals}
                    document={docObject}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
