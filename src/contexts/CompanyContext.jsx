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
  companyName: '',
  businessType: 'Private Limited',
  logo: '',
  themeColor: '#f97316',
  gstNumber: '',
  panNumber: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  cin: '',
  udyamNumber: '',
  bankDetails: {
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    upiId: ''
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
  notes: 'Thank you for your business!',
  paymentInstructions: 'Please include invoice number on your payment reference.',
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
      setCompanies(list);

      const activeId = await getActiveCompanyId();
      let active = null;
      if (activeId) {
        active = list.find(c => c.id === activeId) || null;
      }
      if (!active && list.length > 0) {
        active = list[0];
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
