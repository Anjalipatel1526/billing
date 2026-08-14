import { saveCompany, saveDocument } from '../services/db';

export const mockCompanyAutobourn = {
  id: 'cmp_autobourn_default',
  companyName: 'Autobourn Private Limited',
  businessType: 'Private Limited',
  logo: '',
  watermarkLogo: '',
  themeColor: '#4f46e5', // Sleek Purple/Indigo theme
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
  invoicePrefix: 'INV-2025-',
  invoiceStartNumber: 4,
  voucherPrefix: 'VCH-2025-',
  voucherStartNumber: 3,
  receiptPrefix: 'RCP-2025-',
  receiptStartNumber: 4,
  defaultTax: 18,
  currency: 'INR ₹',
  paymentTerms: 'Payment due within 15 days of invoice date.',
  notes: 'Thank you for choosing Autobourn. We appreciate your business!',
  paymentInstructions: 'Please quote invoice reference number on bank transfer.',
  selectedTemplate: 'UNAI Billing'
};

export const mockDocuments = [
  {
    id: 'doc_inv_2025_001',
    companyId: 'cmp_autobourn_default',
    documentNumber: 'INV-2025-001',
    documentType: 'invoice',
    documentDate: new Date(Date.now() - 2 * 3600000).toISOString().split('T')[0], // 2h ago
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    status: 'Paid',
    customer: {
      customerName: 'TechNova Solutions',
      companyName: 'TechNova Solutions Pvt Ltd',
      billingAddress: '4th Floor, Hitec City',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      gstNumber: '36AAACA9876C1Z3',
      email: 'billing@technova.com',
      phone: '+91 91234 56789'
    },
    items: [
      { id: '1', name: 'Software Development Services', description: 'Development of cloud platform', quantity: 1, rate: 55305.08, taxRate: 18 }
    ],
    totals: {
      subtotal: 55305.08,
      cgst: 4977.46,
      sgst: 4977.46,
      igst: 0,
      discountAmount: 0,
      roundOff: 0,
      grandTotal: 65260.00
    },
    template: 'UNAI Billing',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'doc_vch_2025_002',
    companyId: 'cmp_autobourn_default',
    documentNumber: 'VCH-2025-002',
    documentType: 'voucher',
    voucherType: 'Payment Voucher',
    documentDate: new Date(Date.now() - 4 * 3600000).toISOString().split('T')[0], // 4h ago
    status: 'Paid',
    paidTo: 'Office Expenses',
    paymentMethod: 'Cash',
    amount: 12800,
    totals: { grandTotal: 12800 },
    description: 'Office supply and refreshment expenses.',
    template: 'UNAI Billing',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: 'doc_rcp_2025_003',
    companyId: 'cmp_autobourn_default',
    documentNumber: 'RCP-2025-003',
    documentType: 'receipt',
    documentDate: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0], // 1d ago
    status: 'Paid',
    receivedFrom: 'Payment Received',
    paymentMethod: 'UPI',
    amount: 23150,
    totals: { grandTotal: 23150 },
    description: 'Advance payment for project consultancy.',
    template: 'UNAI Billing',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

export async function populateMockData() {
  await saveCompany(mockCompanyAutobourn);
  for (const doc of mockDocuments) {
    await saveDocument(doc);
  }
}
