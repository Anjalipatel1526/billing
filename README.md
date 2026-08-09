# DocuCraft — SaaS Invoice & Business Document Generator

DocuCraft is a minimal, commercial-grade SaaS Web Application for creating, managing, and exporting professional **Invoices**, **Vouchers**, and **Receipts**. Built with a local-first architecture, businesses enter company details once, and future documents automatically leverage saved profiles, automated tax calculations, number-to-words conversion, and crisp client-side PDF downloads.

---

## Key Features

- **One-Time Onboarding & Persistent Profiles**: Enter business information, logo, GST, and bank details once. Never re-enter details for future documents.
- **Multi-Company Management**: Create and seamlessly switch between multiple business profiles with isolated document counters, default templates, and numbering settings.
- **Dynamic Document Generator**: Supports Invoices, Payment/Receipt/Expense Vouchers, and Payment Confirmation Receipts.
- **Real-Time Live A4 Preview**: Split-screen editor with instant live A4 document updates as items, tax rates, or company details change.
- **Client-Side High Resolution PDF Generation**: Client-rendered A4 PDF downloads powered by `html2canvas` and `jsPDF` without server dependencies.
- **4 Professional Presentation Templates**:
  - **Minimal**: Modern Linear-style minimal design.
  - **Professional**: Corporate header banner layout.
  - **Modern**: Contemporary tech aesthetic with gradient accents and pill tags.
  - **Classic**: Traditional formal accounting format with double rules.
- **Indian Numbering Words Converter**: Converts invoice grand totals into words (e.g., *Rupees Eleven Thousand Eight Hundred Only*).
- **Comprehensive Document History & Actions**: Filter by document type or payment status (Paid, Pending, Overdue, Draft), live search, sort, duplicate, and delete.
- **Local-First Privacy & Backup**: Store all data locally in IndexedDB / LocalStorage. Export and import full JSON backups at any time.

---

## Tech Stack

* **Framework**: React.js 19 + Vite 6
* **Styling**: Tailwind CSS v4 + Poppins Google Font
* **Routing**: React Router 7
* **Icons**: Lucide React
* **Storage**: IndexedDB (`idb`) with LocalStorage fallback
* **PDF Export**: `jsPDF` + `html2canvas`

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
Run local development server:
```bash
npm run dev
```

### Production Build
Build optimized production bundle:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## Data Storage Explanation

DocuCraft employs a **Local-First** data strategy:
1. Primary persistence uses browser **IndexedDB** (`SaaSInvoiceDB`) via the lightweight `idb` wrapper.
2. Synchronous fallback mirrors data in **LocalStorage** to guarantee durability across browser sessions and offline environments.
3. Zero third-party server uploads ensure complete data privacy for company GSTIN, bank account numbers, and customer records.

---

## PDF Generation System

PDF generation executes entirely on the client side:
1. High-resolution canvas rendering via `html2canvas` at `scale: 2` to ensure crisp text and sharp logo resolution.
2. Conversion to a standardized A4 multi-page `jsPDF` document (`210mm x 297mm`) with margins and exact element position calculations.
3. Clean automatic naming conventions:
   - `INV-1001-CustomerName.pdf`
   - `VCH-1001-VendorName.pdf`
   - `REC-1001-CustomerName.pdf`

---

## Project Structure

```text
src/
├── components/
│   ├── company/        # Logo uploader and business form components
│   ├── documents/      # Dynamic item table, customer inputs, filter bars
│   ├── layout/         # Main layout, sidebar, header, company switcher
│   ├── ui/             # Reusable UI buttons, inputs, select, modal, badge, toast
│   └── preview/        # Live A4 document view container
├── contexts/
│   ├── CompanyContext.jsx  # Active company state, multi-company list & onboarding
│   └── DocumentContext.jsx # Document persistence, counter increment, duplication
├── pages/
│   ├── Onboarding.jsx  # Multi-step business setup wizard
│   ├── Dashboard.jsx   # Metrics, quick actions, and recent documents
│   ├── Documents.jsx   # Filterable document history
│   ├── CreateDocument.jsx # Split-screen editor + live A4 preview
│   ├── Companies.jsx   # Business profile manager
│   ├── CompanyEdit.jsx # Edit company, bank details, & defaults
│   ├── Templates.jsx   # Visual template selection grid
│   └── Settings.jsx    # Document defaults & JSON backup/restore
├── services/
│   ├── db.js           # IndexedDB & LocalStorage persistence layer
│   └── pdfGenerator.js # html2canvas + jsPDF engine
├── templates/
│   ├── MinimalTemplate.jsx
│   ├── ProfessionalTemplate.jsx
│   ├── ModernTemplate.jsx
│   ├── ClassicTemplate.jsx
│   └── TemplateWrapper.jsx
├── utils/
│   ├── backup.js       # JSON import and export utilities
│   ├── calculations.js # Subtotal, discounts, CGST/SGST/IGST, roundoff
│   ├── documentNumber.js # Sequential document counter generator
│   ├── formatting.js   # Currency formatting, date format, GST/PAN regex
│   └── numberToWords.js# Indian number to words conversion
├── App.jsx
├── main.jsx
└── index.css
```
