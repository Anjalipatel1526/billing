import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getDocumentById, getCompanyById, getAllDocuments } from '../services/db';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { Button } from '../components/ui/Button';
import { 
  FileText, 
  Download, 
  AlertCircle, 
  Loader2,
  Lock
} from 'lucide-react';
import { ToastProvider, useToast } from '../components/ui/Toast';

const PublicPreviewContent = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState(null);
  const [company, setCompany] = useState(null);
  const [allDocs, setAllDocs] = useState([]);
  
  const printRef = useRef(null);

  useEffect(() => {
    const loadPreviewData = async () => {
      setLoading(true);
      try {
        const documentData = await getDocumentById(id);
        if (!documentData) {
          setLoading(false);
          return;
        }
        
        setDoc(documentData);

        // Fetch company profile associated with the document
        if (documentData.companyId) {
          const [companyData, documentsList] = await Promise.all([
            getCompanyById(documentData.companyId),
            getAllDocuments(documentData.companyId)
          ]);
          setCompany(companyData);
          setAllDocs(documentsList || []);
        }
      } catch (err) {
        console.error('Error loading public preview:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPreviewData();
    }
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!doc || !printRef.current) return;
    
    showToast('Preparing PDF download...', 'info');
    setTimeout(async () => {
      try {
        const prefix = doc.documentNumber || 'Doc';
        const name = doc.customer?.customerName || doc.paidTo || doc.receivedFrom || 'Client';
        const orientation = doc.documentType === 'invoice' || !doc.documentType ? 'portrait' : 'landscape';
        await downloadDocumentPDF(printRef.current, `${prefix}-${name.replace(/\s+/g, '_')}`, orientation);
        showToast('PDF downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to generate PDF.', 'error');
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute w-20 h-20 bg-indigo-500/10 rounded-full animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-slate-800 border border-slate-700 shadow-md flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        </div>
        <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase animate-pulse">
          Loading document...
        </p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-950/30 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-950/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-white font-extrabold text-lg">Document Not Found</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">
          The document you are trying to access does not exist or may have been deleted. Please check the URL link.
        </p>
      </div>
    );
  }

  const invoiceTotals = doc.totals || calculateTotals(doc.items || [], doc.discount);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Premium Top Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-tight leading-none uppercase">
              {doc.documentNumber || 'Document'}
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              {company?.companyName || 'UNAI Workspace'} &bull; {doc.documentType?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button icon={Download} onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-600/20">
            Download PDF
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
        <div className="transform origin-top transition-all duration-300 max-w-full my-4 scale-[0.80] sm:scale-95 md:scale-100">
          <div ref={printRef}>
            <TemplateWrapper
              templateName={doc.template || company?.selectedTemplate || 'UNAI Billing'}
              company={company || {}}
              customer={doc.customer}
              items={doc.items || []}
              totals={invoiceTotals}
              document={doc}
              documents={allDocs}
            />
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-4 border-t border-slate-800 bg-slate-950/40 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
        <Lock className="w-3.5 h-3.5 text-indigo-500/60" />
        <span>Secured by <span className="font-bold text-slate-400">UNAI Billing</span> Enterprise Suite</span>
      </footer>
    </div>
  );
};

export const PublicPreview = () => {
  return (
    <ToastProvider>
      <PublicPreviewContent />
    </ToastProvider>
  );
};

export default PublicPreview;
