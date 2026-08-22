import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { ItemTable } from '../components/documents/ItemTable';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { ResponsiveDocumentWrapper } from '../components/ui/ResponsiveDocumentWrapper';
import { numberToWords } from '../utils/numberToWords';
import { generateNextDocNumber } from '../utils/documentNumber';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { validateEmail, validateGST } from '../utils/formatting';
import { Save, Download, FileText, CreditCard, Receipt, Eye, ArrowLeft, Image as ImageIcon, X, Printer } from 'lucide-react';
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

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');

  // Signature & Notes
  const [notes, setNotes] = useState(activeCompany?.notes || '');
  const [paymentTerms, setPaymentTerms] = useState(activeCompany?.paymentTerms || '');
  const [signature, setSignature] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Scroll direction state for hiding/showing sticky header
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
      const numAmt = typeof amount === 'string' ? (parseFloat(amount) || 0) : (amount || 0);
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



  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
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

    try {
      // 1. Automatically save document first
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

      // 2. Generate and download PDF
      showToast('Generating high quality PDF...', 'info');
      if (previewRef.current) {
        const clientName = customer.customerName || paidTo || receivedFrom || 'Client';
        const filename = `${documentNumber}-${clientName.replace(/\s+/g, '_')}`;
        const orientation = docType === 'invoice' ? 'portrait' : 'landscape';
        await downloadDocumentPDF(previewRef.current, filename, orientation);
        showToast('PDF downloaded successfully!', 'success');
      }

      // 3. Redirect to documents list
      navigate('/documents');
    } catch (err) {
      console.error(err);
      showToast('Failed to save document or export PDF.', 'error');
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setSignature(evt.target.result);
      }
    };
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
      <div className="space-y-4 max-w-[1440px] mx-auto px-4">
        {/* Top Navigation & Actions Bar */}
        <div className={`sticky top-16 md:top-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-[#f1f3f9] shadow-sm transition-all duration-300 ${
          scrollDirection === 'down' ? '-translate-y-40 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/documents')}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight">
                {id ? `Edit ${docType.toUpperCase()}` : `New ${docType.toUpperCase()}`}
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">Click Preview to view the complete A4 document page.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" icon={Eye} onClick={() => setShowPreviewModal(true)}>
              Preview
            </Button>
            <Button variant="outline" icon={Save} onClick={handleSave}>
              Save Document
            </Button>
            <Button icon={Download} onClick={handleDownload}>
              Download PDF
            </Button>
          </div>
        </div>

        {/* Main Grid: Form Editor + Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Editor */}
          <div className="lg:col-span-7 space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-[#f1f3f9] shadow-xs">
          {/* Document Type Selector Tabs + Preview Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">Document Type</label>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-50/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Document</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#f8fafc] border border-[#f1f3f9] p-1 rounded-2xl">
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
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      isSel ? 'bg-white text-blue-600 border border-blue-50/10 shadow-xs' : 'text-slate-500 hover:text-slate-900'
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
                  name="sameShipping"
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
                  name="roundOff"
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
                  <option value="Expense Bill">Expense Bill</option>
                  <option value="Bill">Bill</option>
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
                <Input
                  label="Reference / Transaction #"
                  placeholder="e.g. UTR12345678"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />

                <Input
                  label="Description / Purpose"
                  placeholder="Reason for payment or transaction notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SIGNATURE & NOTES */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Notes & Authorized Signature</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI ID">UPI ID (Google Pay, PhonePe, Paytm, and Other Online Transactions)</option>
              </Select>
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
                <label htmlFor="signatureFile" className="flex items-center gap-2 text-xs text-blue-600 border border-slate-200 hover:bg-slate-50 p-2.5 rounded-lg cursor-pointer w-fit">
                  <ImageIcon className="w-4 h-4" />
                  <span>Upload Signature Image</span>
                  <input
                    id="signatureFile"
                    name="signatureFile"
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

        {/* Right Column: Sticky Live Preview */}
          <div className="hidden lg:block lg:col-span-5 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto bg-slate-100/60 border border-slate-200/80 rounded-3xl p-4 shadow-inner">
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex justify-center items-start">
              <ResponsiveDocumentWrapper isInvoice={docType === 'invoice'}>
                <TemplateWrapper
                  templateName={selectedTemplate}
                  company={activeCompany}
                  customer={customer}
                  items={items}
                  totals={totals}
                  document={docObject}
                  documents={documents}
                />
              </ResponsiveDocumentWrapper>
            </div>
          </div>
        </div>

        {/* ALWAYS RENDERED — Hidden Canvas for PDF Download (must be visible to html2canvas) */}
        <div style={{ position: 'fixed', left: '-20000px', top: 0, opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -99999 }}>
          <div ref={previewRef}>
            <TemplateWrapper
              templateName={selectedTemplate}
              company={activeCompany}
              customer={customer}
              items={items}
              totals={totals}
              document={docObject}
              documents={documents}
            />
          </div>
        </div>

        {/* FULL PAGE DOCUMENT PREVIEW MODAL */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {documentNumber} — Document Preview
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Type: {docType.toUpperCase()} ({docType === 'invoice' ? 'Portrait' : 'Landscape'}) • Template: {selectedTemplate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                    Close Preview
                  </Button>
                </div>
              </div>

              {/* Modal Body - Full A4 View Canvas */}
              <div className="flex-1 bg-slate-200/80 p-6 overflow-auto flex justify-center items-start">
                <ResponsiveDocumentWrapper isInvoice={docType === 'invoice'}>
                  <TemplateWrapper
                    templateName={selectedTemplate}
                    company={activeCompany}
                    customer={customer}
                    items={items}
                    totals={totals}
                    document={docObject}
                    documents={documents}
                  />
                </ResponsiveDocumentWrapper>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-2">
                <Button variant="outline" icon={Printer} onClick={handleDownload}>
                  Print
                </Button>
                <Button icon={Download} onClick={handleDownload}>
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
