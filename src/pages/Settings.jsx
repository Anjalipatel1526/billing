import React, { useState, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { exportAllDataAsJSON, importDataFromJSON } from '../utils/backup';
import { clearAllData } from '../services/db';
import { isSupabaseConfigured } from '../lib/supabase';
import { Download, Upload, Trash2, Building2, Sliders, HardDrive, AlertTriangle, Database, CheckCircle2, Server } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const { activeCompany, updateActiveCompany, reloadCompanies } = useCompany();
  const { refetchDocuments } = useDocument();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const supabaseConnected = isSupabaseConfigured();

  // Defaults form state
  const [invoicePrefix, setInvoicePrefix] = useState(activeCompany?.invoicePrefix || 'INV-');
  const [invoiceStartNumber, setInvoiceStartNumber] = useState(activeCompany?.invoiceStartNumber || 1001);
  const [currency, setCurrency] = useState(activeCompany?.currency || 'INR ₹');
  const [defaultTax, setDefaultTax] = useState(activeCompany?.defaultTax || 18);
  const [paymentTerms, setPaymentTerms] = useState(activeCompany?.paymentTerms || '');

  const handleSaveDefaults = async (e) => {
    e.preventDefault();
    try {
      await updateActiveCompany({
        invoicePrefix,
        invoiceStartNumber: parseInt(invoiceStartNumber, 10) || 1001,
        currency,
        defaultTax: parseFloat(defaultTax) || 0,
        paymentTerms
      });
      showToast('Document settings saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings.', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      await exportAllDataAsJSON();
      showToast('Data exported successfully as JSON file.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export data.', 'error');
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('Importing data will restore companies and documents from the backup file. Continue?')) {
      try {
        const res = await importDataFromJSON(file);
        await reloadCompanies();
        await refetchDocuments();
        showToast(`Imported ${res.companiesCount} companies and ${res.documentsCount} documents!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Invalid backup file format.', 'error');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      await reloadCompanies();
      await refetchDocuments();
      setConfirmClearModal(false);
      showToast('All local and Supabase data cleared successfully.', 'info');
      navigate('/onboarding');
    } catch (err) {
      console.error(err);
      showToast('Failed to clear data.', 'error');
    }
  };

  return (
    <MainLayout title="Settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h1 className="font-bold text-slate-900 text-lg">Application Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage document numbering, company profile, Supabase sync, and backups.</p>
        </div>

        {/* Supabase Connection Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm">Supabase Backend Integration</h2>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              supabaseConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {supabaseConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
              <span>{supabaseConnected ? 'Supabase Active & Connected' : 'Local IndexedDB Mode'}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {supabaseConnected
              ? 'Your companies, invoices, vouchers, and receipts are continuously synced to your remote Supabase PostgreSQL database.'
              : 'Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable live remote PostgreSQL cloud sync.'}
          </p>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 font-sans text-xs mb-1">Environment Variable Status:</p>
            <p>VITE_SUPABASE_URL: <span className="text-blue-600">{import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Not set (Using Local Fallback)'}</span></p>
            <p>VITE_SUPABASE_ANON_KEY: <span className="text-blue-600">{import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Not set (Using Local Fallback)'}</span></p>
          </div>
        </div>

        {/* Company Quick Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{activeCompany?.companyName || 'Business Profile'}</h3>
              <p className="text-xs text-slate-500">{activeCompany?.businessType} • GST: {activeCompany?.gstNumber || 'N/A'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/companies/${activeCompany?.id}`)}>
            Edit Company Profile
          </Button>
        </div>

        {/* Invoice & Document Defaults */}
        <form onSubmit={handleSaveDefaults} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Document Defaults</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Number Prefix"
              placeholder="INV-"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
            />
            <Input
              label="Starting Counter Number"
              type="number"
              value={invoiceStartNumber}
              onChange={(e) => setInvoiceStartNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Currency Format"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR ₹">INR ₹ (Indian Rupee)</option>
              <option value="USD $">USD $ (US Dollar)</option>
              <option value="EUR €">EUR € (Euro)</option>
              <option value="GBP £">GBP £ (British Pound)</option>
            </Select>

            <Input
              label="Default Tax Rate (%)"
              type="number"
              value={defaultTax}
              onChange={(e) => setDefaultTax(e.target.value)}
            />
          </div>

          <Input
            label="Default Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />

          <div className="pt-2">
            <Button type="submit">Save Defaults</Button>
          </div>
        </form>

        {/* Data Backup & Restore */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardDrive className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-slate-900 text-sm">Data Backup & Restore</h2>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            All your business profiles and invoices are backed up and synced automatically. Export periodic JSON backups for offline archiving.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="outline" icon={Download} onClick={handleExportData}>
              Export Data Backup (JSON)
            </Button>

            <label className="inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg text-xs px-3.5 py-2 gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import Data Backup</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </label>
          </div>
        </div>

        {/* Destructive Action Zone */}
        <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 space-y-3">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="font-bold text-xs uppercase tracking-wider">Destructive Actions</h2>
          </div>

          <p className="text-xs text-slate-600">
            Permanently remove all companies, invoices, vouchers, and settings from storage.
          </p>

          <Button variant="danger" icon={Trash2} onClick={() => setConfirmClearModal(true)}>
            Clear All Data
          </Button>
        </div>

        {/* Clear Data Confirmation Modal */}
        <Modal
          isOpen={confirmClearModal}
          onClose={() => setConfirmClearModal(false)}
          title="Confirm Clear All Data"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmClearModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleClearData}>
                Yes, Clear All Data
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-slate-700 text-xs">
            <p className="font-semibold text-rose-600">Warning: This action cannot be undone!</p>
            <p>
              Are you sure you want to clear all companies and invoices? Make sure you have exported a JSON backup first.
            </p>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};
