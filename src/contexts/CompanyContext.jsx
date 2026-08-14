import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAllCompanies, 
  saveCompany as dbSaveCompany, 
  deleteCompany as dbDeleteCompany, 
  getActiveCompanyId, 
  setActiveCompanyId as dbSetActiveCompanyId,
  getLocalCompanyIds
} from '../services/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const CompanyContext = createContext(null);

export const defaultCompanyState = {
  companyName: '',
  businessType: 'Private Limited',
  logo: '',
  watermarkLogo: '',
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
  selectedTemplate: 'UNAI Billing',
  companyCode: '',
  companyPassword: ''
};

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      let localIdsArray = await getLocalCompanyIds();
      
      // Auto-seed mock Autobourn company if workspace is completely fresh
      if (localIdsArray.length === 0) {
        const { populateMockData } = await import('../utils/sampleData');
        await populateMockData();
        await dbSetActiveCompanyId('cmp_autobourn_default');
        localIdsArray = await getLocalCompanyIds();
      }

      const list = await getAllCompanies();
      const localIdsSet = new Set(localIdsArray);
      
      // Filter out duplicate profiles by ID or company name, and only keep locally joined/created ones
      const uniqueList = [];
      const seenIds = new Set();
      const seenNames = new Set();

      for (let comp of list) {
        if (!comp || !comp.companyName) continue;
        if (!localIdsSet.has(comp.id)) continue;
        const normName = comp.companyName.trim().toLowerCase();
        if (!seenIds.has(comp.id) && !seenNames.has(normName)) {
          seenIds.add(comp.id);
          seenNames.add(normName);

          let needsUpdate = false;
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
            needsUpdate = true;
          }

          // Force-load default logo for Autobourn if none is set
          const isAutobourn = comp.id === 'cmp_autobourn_default' || normName.includes('autobourn');
          if (isAutobourn && !comp.logo) {
            comp.logo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2VhMDAwMCIgLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg4LCA4KSI+PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTkgMTdoMmMuNiAwIDEtLjQgMS0xdi0zYzAtLjktLjctMS43LTEuNS0xLjlDMTguNyAxMC42IDE2IDEwIDE2IDEwcy0xLjMtMS40LTIuMi0yLjNjLS41LS40LTEuMS0uNy0xLjgtLjdINWMtLjYgMC0xLjEuNC0xLjQuOWwtMS40IDIuOUEzLjcgMy43IDAgMCAwIDIgMTJ2NGMwIC42LjQgMSAxIDFoMiIgLz4KICAgICAgPGNpcmNsZSBjeD0iNyIgY3k9IjE3IiByPSIyIiBmaWxsPSIjZmZmZmZmIiAvPgogICAgICA8Y2lyY2xlIGN4PSIxNyIgY3k9IjE3IiByPSIyIiBmaWxsPSIjZmZmZmZmIiAvPgogICAgICA8cGF0aCBkPSJNNyAxN2gxMCIgLz4KICAgIDwvc3ZnPgogIDwvZz4KPC9zdmc+';
            needsUpdate = true;
          }

          if (needsUpdate) {
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

    if (isSupabaseConfigured()) {
      const companiesChannel = supabase
        .channel('companies-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'companies' },
          () => {
            loadData();
          }
        )
        .subscribe();

      const settingsChannel = supabase
        .channel('settings-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(companiesChannel);
        supabase.removeChannel(settingsChannel);
      };
    }
  }, []);

  const switchCompany = async (companyId) => {
    let found = companies.find(c => c.id === companyId);
    if (!found) {
      const list = await getAllCompanies();
      found = list.find(c => c.id === companyId);
    }
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
