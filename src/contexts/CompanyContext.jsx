import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAllCompanies, 
  saveCompany as dbSaveCompany, 
  deleteCompany as dbDeleteCompany, 
  getActiveCompanyId, 
  setActiveCompanyId as dbSetActiveCompanyId 
} from '../services/db';

const CompanyContext = createContext(null);

export const defaultCompanyState = {
  companyName: 'Autobourn',
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

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAllCompanies();
      
      // Filter out duplicate profiles by ID or company name
      const uniqueList = [];
      const seenIds = new Set();
      const seenNames = new Set();

      for (let comp of list) {
        if (!comp || !comp.companyName) continue;
        const normName = comp.companyName.trim().toLowerCase();
        if (!seenIds.has(comp.id) && !seenNames.has(normName)) {
          seenIds.add(comp.id);
          seenNames.add(normName);

          // Enrich company with complete mock details if essential fields (email, phone, address) are missing
          if (!comp.email || !comp.phone || !comp.address) {
            comp = {
              ...defaultCompanyState,
              ...comp,
              email: comp.email || `${normName.replace(/\s+/g, '')}@gmail.com`,
              phone: comp.phone || '+91 98765 43210',
              address: comp.address || 'Suite 402, Pinnacle Tech Park, Andheri East',
              city: comp.city || 'Mumbai',
              state: comp.state || 'Maharashtra',
              gstNumber: comp.gstNumber || '27AAACA1234B1Z9',
              panNumber: comp.panNumber || 'AAACA1234B',
              bankDetails: {
                ...defaultCompanyState.bankDetails,
                ...(comp.bankDetails || {})
              }
            };
            // Save enriched details back so it persists
            dbSaveCompany(comp).catch(console.error);
          }

          uniqueList.push(comp);
        }
      }

      setCompanies(uniqueList);

      const activeId = await getActiveCompanyId();
      let active = null;
      if (activeId) {
        active = uniqueList.find(c => c.id === activeId) || null;
      }
      if (!active && uniqueList.length > 0) {
        active = uniqueList[0];
        await dbSetActiveCompanyId(active.id);
      }
      setActiveCompany(active);
    } catch (err) {
      console.error('Failed to load company data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const switchCompany = async (companyId) => {
    const found = companies.find(c => c.id === companyId);
    if (found) {
      setActiveCompany(found);
      await dbSetActiveCompanyId(found.id);
    }
  };

  const saveCompanyProfile = async (companyData) => {
    const id = companyData.id || `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fullData = { ...defaultCompanyState, ...companyData, id };
    
    const saved = await dbSaveCompany(fullData);
    
    await loadData();
    await switchCompany(saved.id);
    return saved;
  };

  const updateActiveCompany = async (updates) => {
    if (!activeCompany) return null;
    const updated = { ...activeCompany, ...updates };
    const saved = await dbSaveCompany(updated);
    
    setCompanies(prev => prev.map(c => c.id === saved.id ? saved : c));
    setActiveCompany(saved);
    return saved;
  };

  const removeCompany = async (companyId) => {
    await dbDeleteCompany(companyId);
    const updatedList = companies.filter(c => c.id !== companyId);
    setCompanies(updatedList);
    
    if (activeCompany?.id === companyId) {
      const nextActive = updatedList[0] || null;
      setActiveCompany(nextActive);
      await dbSetActiveCompanyId(nextActive ? nextActive.id : null);
    }
  };

  const value = {
    companies,
    activeCompany,
    loading,
    switchCompany,
    saveCompanyProfile,
    updateActiveCompany,
    removeCompany,
    reloadCompanies: loadData
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
