import { saveCompany, saveDocument } from '../services/db';

export const mockCompanyAutobourn = {
  id: 'cmp_autobourn_default',
  companyName: 'Autobourn Private Limited',
  businessType: 'Private Limited',
  logo: '',
  watermarkLogo: '',
  themeColor: '#2563eb',
  gstNumber: '27AAACA1234B1Z9',
  panNumber: 'AAACA1234B',
  email: 'contact@autobourn.com',
  phone: '+91 98765 43210',
  website: 'https://autobourn.com',
  address: 'Suite 402, Pinnacle Tech Park, Next to Metro Station, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  pincode: '400069',
  cin: 'U72900MH2023PTC123456',
  udyamNumber: 'UDYAM-MH-03-0012345',
  bankDetails: {
    bankName: 'HDFC Bank Ltd',
    accountHolder: 'Autobourn Private Limited',
    accountNumber: '50200088991122',
    ifsc: 'HDFC0000240',
    branch: 'Andheri East Branch',
    upiId: 'autobourn@hdfcbank'
  },
  invoicePrefix: 'INV-',
  invoiceStartNumber: 1001,
  voucherPrefix: 'VCH-',
  voucherStartNumber: 1001,
  receiptPrefix: 'REC-',
  receiptStartNumber: 1001,
  defaultTax: 18,
  currency: 'INR ₹',
  paymentTerms: 'Payment due within 15 days of invoice date.',
  notes: 'Thank you for choosing Autobourn. We appreciate your business!',
  paymentInstructions: 'Please quote invoice reference number on bank transfer.',
  selectedTemplate: 'UNAI Billing'
};

export const mockDocuments = [
  {
    id: 'doc_inv_1001',
    companyId: 'cmp_autobourn_default',
    documentNumber: 'INV-1001',
    documentType: 'invoice',
    documentDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    status: 'Paid',
    customer: {
      customerName: 'Acme Global Technologies',
      companyName: 'Acme Global Pvt Ltd',
      billingAddress: '7th Floor, Cyber Towers, Hitec City',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      gstNumber: '36AAACA9876C1Z3',
      email: 'finance@acmeglobal.com',
      phone: '+91 91234 56789'
    },
    items: [
      { id: '1', name: 'SaaS Software License (Annual Subscription)', description: 'Enterprise Plan with multi-tenant access', quantity: 1, rate: 45000, taxRate: 18 },
      { id: '2', name: 'Custom API Integration & Onboarding', description: 'Implementation setup & developer training', quantity: 1, rate: 15000, taxRate: 18 }
    ],
    totals: {
      subtotal: 60000,
      cgst: 5400,
      sgst: 5400,
      igst: 0,
      discountAmount: 0,
      roundOff: 0,
      grandTotal: 70800
    },
    template: 'UNAI Billing',
    notes: 'Payment received with thanks via Wire Transfer.'
  },
  {
    id: 'doc_vch_1001',
    companyId: 'cmp_autobourn_default',
    documentNumber: 'VCH-1001',
    documentType: 'voucher',
    voucherType: 'PAYMENT VOUCHER',
    documentDate: new Date().toISOString().split('T')[0],
    status: 'Paid',
    paidTo: 'Cloud Server Hosting Operations',
    paymentMethod: 'Bank Wire Transfer',
    referenceNumber: 'TXN-99887711',
    amount: 12500,
    totals: { grandTotal: 12500 },
    description: 'Monthly cloud infrastructure hosting and CDN bandwidth usage.',
    template: 'UNAI Billing'
  }
];

export async function populateMockData() {
  await saveCompany(mockCompanyAutobourn);
  for (const doc of mockDocuments) {
    await saveDocument(doc);
  }
}
