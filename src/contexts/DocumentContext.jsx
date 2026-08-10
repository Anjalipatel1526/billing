import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getAllDocuments, 
  saveDocument as dbSaveDocument, 
  deleteDocument as dbDeleteDocument,
  getDocumentById 
} from '../services/db';
import { useCompany } from './CompanyContext';
import { generateNextDocNumber } from '../utils/documentNumber';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const { activeCompany, updateActiveCompany } = useCompany();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!activeCompany) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getAllDocuments(activeCompany.id);
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || b.documentDate) - new Date(a.createdAt || a.documentDate));
      setDocuments(list);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    fetchDocuments();

    if (isSupabaseConfigured()) {
      const docsChannel = supabase
        .channel('documents-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'documents' },
          () => {
            fetchDocuments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(docsChannel);
      };
    }
  }, [fetchDocuments]);

  const saveDoc = async (docData) => {
    if (!activeCompany) throw new Error('No active company selected');

    const isNew = !docData.id;
    const now = new Date().toISOString();
    
    let docNumber = docData.documentNumber;
    
    // Auto-assign doc number if not provided or if new
    if (isNew && !docNumber) {
      if (docData.documentType === 'voucher') {
        docNumber = generateNextDocNumber(activeCompany.voucherPrefix || 'VCH-', activeCompany.voucherStartNumber || 1001);
      } else if (docData.documentType === 'receipt') {
        docNumber = generateNextDocNumber(activeCompany.receiptPrefix || 'REC-', activeCompany.receiptStartNumber || 1001);
      } else {
        docNumber = generateNextDocNumber(activeCompany.invoicePrefix || 'INV-', activeCompany.invoiceStartNumber || 1001);
      }
    }

    const payload = {
      ...docData,
      id: docData.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      companyId: activeCompany.id,
      documentNumber: docNumber,
      createdAt: docData.createdAt || now,
      updatedAt: now,
      status: docData.status || 'Pending'
    };

    const saved = await dbSaveDocument(payload);

    // If new document, increment company starting number counter
    if (isNew) {
      if (payload.documentType === 'voucher') {
        await updateActiveCompany({ voucherStartNumber: (parseInt(activeCompany.voucherStartNumber, 10) || 1001) + 1 });
      } else if (payload.documentType === 'receipt') {
        await updateActiveCompany({ receiptStartNumber: (parseInt(activeCompany.receiptStartNumber, 10) || 1001) + 1 });
      } else {
        await updateActiveCompany({ invoiceStartNumber: (parseInt(activeCompany.invoiceStartNumber, 10) || 1001) + 1 });
      }
    }

    await fetchDocuments();
    return saved;
  };

  const removeDoc = async (id) => {
    await dbDeleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const duplicateDoc = async (id) => {
    const existing = documents.find(d => d.id === id) || await getDocumentById(id);
    if (!existing || !activeCompany) return null;

    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Generate new doc number
    let newNumber = '';
    if (existing.documentType === 'voucher') {
      newNumber = generateNextDocNumber(activeCompany.voucherPrefix || 'VCH-', activeCompany.voucherStartNumber || 1001);
    } else if (existing.documentType === 'receipt') {
      newNumber = generateNextDocNumber(activeCompany.receiptPrefix || 'REC-', activeCompany.receiptStartNumber || 1001);
    } else {
      newNumber = generateNextDocNumber(activeCompany.invoicePrefix || 'INV-', activeCompany.invoiceStartNumber || 1001);
    }

    const duplicatedPayload = {
      ...existing,
      id: undefined, // Will be generated as new
      documentNumber: newNumber,
      documentDate: todayStr,
      dueDate: todayStr,
      status: 'Draft',
      createdAt: undefined,
      updatedAt: undefined
    };

    return await saveDoc(duplicatedPayload);
  };

  const value = {
    documents,
    loading,
    saveDoc,
    removeDoc,
    duplicateDoc,
    refetchDocuments: fetchDocuments
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};
