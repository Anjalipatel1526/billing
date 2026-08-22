import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../components/ui/Toast';
import { useDocument } from '../contexts/DocumentContext';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { 
  getAllExpenses, 
  saveExpense, 
  deleteExpense,
  rowToExpense
} from '../services/db';
import { 
  Plus, 
  Search, 
  Trash2, 
  FolderKanban, 
  DollarSign, 
  Calendar, 
  Tag, 
  X, 
  Briefcase, 
  Home, 
  Zap, 
  Users, 
  Megaphone, 
  Plane, 
  Coffee, 
  Coins, 
  Filter,
  Download,
  FileText,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatting';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const CATEGORIES = [
  { value: 'Office Supplies', label: 'Office Supplies', color: 'blue', icon: Briefcase },
  { value: 'Rent', label: 'Rent', color: 'purple', icon: Home },
  { value: 'Utilities', label: 'Utilities & Power', color: 'amber', icon: Zap },
  { value: 'Salaries', label: 'Salaries & Wages', color: 'emerald', icon: Users },
  { value: 'Marketing', label: 'Marketing & Ads', color: 'rose', icon: Megaphone },
  { value: 'Travel', label: 'Travel & Commute', color: 'indigo', icon: Plane },
  { value: 'Food & Refreshment', label: 'Food & Pantry', color: 'orange', icon: Coffee },
  { value: 'Others', label: 'Other Expenses', color: 'slate', icon: Coins }
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'UPI'];

export const Expenses = () => {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();
  const { saveDoc, removeDoc } = useDocument();
  const printRef = useRef(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUsedProject, setLastUsedProject] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [newExpense, setNewExpense] = useState({
    particulars: '',
    amount: '',
    category: 'Office Supplies',
    date: new Date().toISOString().split('T')[0],
    projectEvent: '',
    paidVia: 'Cash'
  });

  const currencySymbol = activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';

  // Load expenses
  const loadExpenses = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await getAllExpenses(activeCompany.id);
      setExpenses(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeCompany, showToast]);

  useEffect(() => {
    loadExpenses();
  }, [activeCompany?.id, loadExpenses]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // List of unique projects for filter panel
  const uniqueProjects = useMemo(() => {
    const projects = expenses
      .map(e => e.projectEvent?.trim())
      .filter(p => !!p);
    return Array.from(new Set(projects));
  }, [expenses]);

  // List of unique categories for filter panel
  const uniqueCategories = useMemo(() => {
    const cats = expenses
      .map(e => e.category?.trim())
      .filter(c => !!c);
    const knownCats = CATEGORIES.map(c => c.value);
    const customCats = cats.filter(c => !knownCats.includes(c));
    return Array.from(new Set(customCats));
  }, [expenses]);

  // Filtered suggestions for Project/Event dropdown
  const filteredProjectSuggestions = useMemo(() => {
    const query = (newExpense.projectEvent || '').toLowerCase().trim();
    if (!query) return uniqueProjects;
    return uniqueProjects.filter(proj => proj.toLowerCase().includes(query));
  }, [uniqueProjects, newExpense.projectEvent]);

  // Handle open modal
  const handleOpenModal = () => {
    const initialProject = (selectedProject !== 'all' && selectedProject !== 'none') ? selectedProject : lastUsedProject;
    setNewExpense({
      particulars: '',
      amount: '',
      category: 'Office Supplies',
      date: new Date().toISOString().split('T')[0],
      projectEvent: initialProject,
      paidVia: 'Cash'
    });
    
    setCustomCategory('');
    setShowProjectDropdown(false);
    setIsModalOpen(true);
  };

  // Computed Stats
  const stats = useMemo(() => {
    let total = 0;
    let thisMonth = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    expenses.forEach(e => {
      total += e.amount;
      const d = new Date(e.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonth += e.amount;
      }
    });

    return {
      total,
      thisMonth,
      projectCount: uniqueProjects.length
    };
  }, [expenses, uniqueProjects]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.particulars.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (e.projectEvent && e.projectEvent.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
      const matchesProject = 
        selectedProject === 'all' 
          ? true 
          : selectedProject === 'none' 
            ? !e.projectEvent 
            : e.projectEvent === selectedProject;
      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [expenses, searchTerm, selectedCategory, selectedProject]);

  // Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!newExpense.particulars.trim() || !newExpense.amount) {
      showToast('Please fill in particulars and amount', 'warning');
      return;
    }

    // Close the modal immediately so it disappears from the UI
    setIsModalOpen(false);
    setIsSaving(true);

    try {
      const expId = `exp_${Date.now()}`;
      const amountVal = parseFloat(newExpense.amount);

      // Save as document representation first (without pre-set ID, letting saveDoc assign a new one + number + counter update)
      const docPayload = {
        companyId: activeCompany.id,
        documentType: 'voucher',
        voucherType: 'Expense Bill',
        documentDate: newExpense.date,
        status: 'Paid',
        paidTo: newExpense.projectEvent || newExpense.category || 'Office Expenses',
        paymentMethod: newExpense.paidVia || 'Cash',
        amount: amountVal,
        totals: { grandTotal: amountVal },
        description: `${newExpense.particulars} (Category: ${newExpense.category})`,
        template: activeCompany.selectedTemplate || 'UNAI Billing'
      };
      
      const savedDoc = await saveDoc(docPayload);

      // Now save the expense payload, referencing the document's id!
      const payload = {
        ...newExpense,
        id: expId,
        companyId: activeCompany.id,
        amount: amountVal,
        documentId: savedDoc.id
      };

      await saveExpense(payload);
      showToast('Expense created and saved as document successfully!', 'success');
      
      // Store as last used project
      setLastUsedProject(newExpense.projectEvent);
      
      // Reset form (keeping project values ready for next time handleOpenModal is called)
      setNewExpense({
        particulars: '',
        amount: '',
        category: 'Office Supplies',
        date: new Date().toISOString().split('T')[0],
        projectEvent: newExpense.projectEvent,
        paidVia: 'Cash'
      });
      setCustomCategory('');
      loadExpenses();
    } catch (err) {
      console.error(err);
      showToast('Failed to save expense', 'error');
      // Re-open modal so user doesn't lose their data
      setIsModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = (id) => {
    setDeleteExpenseId(id);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    try {
      const expenseToDelete = expenses.find(e => e.id === deleteExpenseId);
      await deleteExpense(deleteExpenseId);

      // Attempt to delete corresponding document representation if it exists
      if (expenseToDelete && expenseToDelete.documentId) {
        try {
          await removeDoc(expenseToDelete.documentId);
        } catch (err) {
          console.warn('Corresponding document could not be deleted:', err);
        }
      } else {
        // Fallback to check if a legacy doc exists with id `doc_${deleteExpenseId}`
        try {
          await removeDoc(`doc_${deleteExpenseId}`);
        } catch (e) {}
      }

      showToast('Expense deleted successfully', 'success');
      loadExpenses();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete expense', 'error');
    } finally {
      setDeleteExpenseId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('No expenses found for the current filters to export.', 'warning');
      return;
    }

    try {
      const headers = ['Date', 'Category', 'Particulars/Description', 'Project/Event', 'Payment Method', `Amount (${currencySymbol})`];
      const csvRows = [headers.join(',')];

      filteredExpenses.forEach(e => {
        const row = [
          e.date,
          `"${(e.category || '').replace(/"/g, '""')}"`,
          `"${e.particulars.replace(/"/g, '""')}"`,
          `"${(e.projectEvent || 'General Office').replace(/"/g, '""')}"`,
          e.paidVia || 'Cash',
          e.amount.toFixed(2)
        ];
        csvRows.push(row.join(','));
      });

      // Add total row
      const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      const summaryRow = ['TOTAL', '', '', '', '', totalAmount.toFixed(2)];
      csvRows.push(summaryRow.join(','));

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const projStr = selectedProject === 'all' ? 'All_Projects' : selectedProject.replace(/\s+/g, '_');
      link.setAttribute('download', `Expenses_${projStr}_Report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Expenses Excel CSV exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Excel CSV.', 'error');
    }
  };

  const handleExportPDF = async () => {
    if (filteredExpenses.length === 0) {
      showToast('No expenses found for the current filters to export.', 'warning');
      return;
    }

    showToast('Generating Expense PDF Report...', 'info');
    setTimeout(async () => {
      try {
        if (printRef.current) {
          const projStr = selectedProject === 'all' ? 'All_Projects' : selectedProject.replace(/\s+/g, '_');
          await downloadDocumentPDF(printRef.current, `Expenses_${projStr}_Report`, 'portrait');
          showToast('Expense PDF downloaded successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to export PDF.', 'error');
      }
    }, 300);
  };

  const getCategoryColorClasses = (catName) => {
    const cat = CATEGORIES.find(c => c.value === catName);
    if (!cat) return { bg: 'bg-slate-50', text: 'text-slate-700', iconBg: 'bg-slate-100 text-slate-500' };
    switch (cat.color) {
      case 'blue': return { bg: 'bg-blue-50/70', text: 'text-blue-700', iconBg: 'bg-blue-50 text-blue-600' };
      case 'purple': return { bg: 'bg-purple-50/70', text: 'text-purple-700', iconBg: 'bg-purple-50 text-purple-600' };
      case 'amber': return { bg: 'bg-amber-50/70', text: 'text-amber-700', iconBg: 'bg-amber-50 text-amber-600' };
      case 'emerald': return { bg: 'bg-emerald-50/70', text: 'text-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600' };
      case 'rose': return { bg: 'bg-rose-50/70', text: 'text-rose-700', iconBg: 'bg-rose-50 text-rose-600' };
      case 'indigo': return { bg: 'bg-indigo-50/70', text: 'text-indigo-700', iconBg: 'bg-indigo-50 text-indigo-600' };
      case 'orange': return { bg: 'bg-orange-50/70', text: 'text-orange-700', iconBg: 'bg-orange-50 text-orange-600' };
      default: return { bg: 'bg-slate-50/70', text: 'text-slate-700', iconBg: 'bg-slate-50 text-slate-500' };
    }
  };

  const getCategoryIcon = (catName) => {
    const cat = CATEGORIES.find(c => c.value === catName);
    return cat ? cat.icon : Coins;
  };

  return (
    <MainLayout title="Expenses">
      <div className="space-y-6">
        
        {/* Page Header and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs">
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">Company Expenses</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Track, categorize, and assign expenses to projects or events.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-3 rounded-2xl shadow-xs transition-all cursor-pointer"
              title="Export Current Expenses to Excel CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-3 rounded-2xl shadow-xs transition-all cursor-pointer"
              title="Download Current Expenses PDF Statement"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Expense</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Expenses</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(stats.total, currencySymbol)}</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">Cumulative outflows recorded</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">This Month</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(stats.thisMonth, currencySymbol)}</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">Outflow during current month</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Projects / Events</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.projectCount}</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">Campaigns & projects tagged</p>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <h3 className="font-extrabold text-sm text-slate-800">Filters</h3>
            </div>
            
            {/* Clear Filters */}
            {(searchTerm || selectedCategory !== 'all' || selectedProject !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedProject('all');
                }}
                className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer w-fit"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="searchTerm"
                name="searchTerm"
                type="text"
                placeholder="Search description, project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
              />
            </div>

            {/* Category Dropdown */}
            <select
              id="selectedCategory"
              name="selectedCategory"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Project/Event Dropdown */}
            <select
              id="selectedProject"
              name="selectedProject"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
            >
              <option value="all">All Projects & Events</option>
              <option value="none">Without Project / Event</option>
              {uniqueProjects.map(proj => (
                <option key={proj} value={proj}>{proj}</option>
              ))}
            </select>
          </div>

          {/* Quick Click Project Filter Tags */}
          {uniqueProjects.length > 0 && (
            <div className="pt-2 border-t border-slate-100/80">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Quick Filter by Project / Event:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedProject('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                    selectedProject === 'all' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  All Projects
                </button>
                <button
                  onClick={() => setSelectedProject('none')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                    selectedProject === 'none' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Without Project
                </button>
                {uniqueProjects.map(proj => (
                  <button
                    key={proj}
                    onClick={() => setSelectedProject(proj)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                      selectedProject === proj 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-blue-50/50 hover:bg-blue-50 text-blue-600 border border-blue-100/50'
                    }`}
                  >
                    {proj}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses List Table */}
        <div className="bg-white rounded-3xl border border-[#f1f3f9] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">Transaction Logs</h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                Showing {filteredExpenses.length} of {expenses.length} Entries
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Project / Event</th>
                  <th className="py-4 px-6">Paid Via</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Loading expenses...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">
                      <div className="max-w-xs mx-auto space-y-3">
                        <p className="text-slate-400 text-xs">No expense records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((row) => {
                    const colors = getCategoryColorClasses(row.category);
                    const Icon = getCategoryIcon(row.category);
                    
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Date */}
                        <td className="py-4.5 px-6 text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>

                        {/* Particulars */}
                        <td className="py-4.5 px-6 font-semibold text-slate-800">
                          {row.particulars}
                        </td>

                        {/* Category */}
                        <td className="py-4.5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {row.category}
                          </span>
                        </td>

                        {/* Project / Event */}
                        <td className="py-4.5 px-6">
                          {row.projectEvent ? (
                            <button
                              onClick={() => setSelectedProject(row.projectEvent)}
                              className="inline-flex items-center gap-1 bg-blue-50/40 hover:bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100/30 text-[9px] font-bold transition-all cursor-pointer"
                              title="Click to filter by this project"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {row.projectEvent}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">General Office</span>
                          )}
                        </td>

                        {/* Paid Via */}
                        <td className="py-4.5 px-6 text-slate-500 font-semibold text-[11px]">
                          {row.paidVia}
                        </td>

                        {/* Amount */}
                        <td className="py-4.5 px-6 text-right text-slate-900 font-black text-xs">
                          {formatCurrency(row.amount, currencySymbol)}
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-center">
                          <button
                            onClick={() => handleDeleteExpense(row.id)}
                            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer active:scale-95"
                            title="Delete Expense Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm">Add New Expense</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                {/* Project / Event Name */}
                <div className="space-y-1 relative" ref={projectDropdownRef}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Project / Event Name (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select or type a Project/Event"
                      value={newExpense.projectEvent}
                      onChange={(e) => {
                        setNewExpense(prev => ({ ...prev, projectEvent: e.target.value }));
                        setShowProjectDropdown(true);
                      }}
                      onFocus={() => setShowProjectDropdown(true)}
                      className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                    />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                  </div>

                  {showProjectDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-48 overflow-y-auto py-1">
                      {filteredProjectSuggestions.length > 0 ? (
                        filteredProjectSuggestions.map(proj => (
                          <button
                            key={proj}
                            type="button"
                            onClick={() => {
                              setNewExpense(prev => ({ ...prev, projectEvent: proj }));
                              setShowProjectDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            {proj}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-slate-400 font-semibold">No matching projects found</div>
                      )}

                      {/* Add new option */}
                      {newExpense.projectEvent.trim() !== '' && !uniqueProjects.some(p => p.toLowerCase() === newExpense.projectEvent.trim().toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowProjectDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 border-t border-slate-100 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add &quot;{newExpense.projectEvent.trim()}&quot; as new Project/Event</span>
                        </button>
                      )}

                      {newExpense.projectEvent !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewExpense(prev => ({ ...prev, projectEvent: '' }));
                            setShowProjectDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 border-t border-slate-100 hover:bg-rose-50 transition-colors"
                        >
                          Clear (Without Project/Event)
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[9px] text-slate-400">
                    Search or type a new/existing project or event.
                  </p>
                </div>

                {/* Particulars / Description */}
                <div className="space-y-1">
                  <label htmlFor="expenseParticulars" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Particulars / Description</label>
                  <input
                    id="expenseParticulars"
                    name="expenseParticulars"
                    type="text"
                    required
                    placeholder="e.g. Office catering, Server hosting, Travel allowance"
                    value={newExpense.particulars}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, particulars: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-1">
                    <label htmlFor="expenseAmount" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amount ({currencySymbol})</label>
                    <input
                      id="expenseAmount"
                      name="expenseAmount"
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label htmlFor="expenseDate" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date</label>
                    <input
                      id="expenseDate"
                      name="expenseDate"
                      type="date"
                      required
                      value={newExpense.date}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label htmlFor="expenseCategory" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</label>
                    <select
                      id="expenseCategory"
                      name="expenseCategory"
                      value={CATEGORIES.map(c => c.value).includes(newExpense.category) ? newExpense.category : 'Others'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Others') {
                          setNewExpense(prev => ({ ...prev, category: 'Others' }));
                          setCustomCategory('');
                        } else {
                          setNewExpense(prev => ({ ...prev, category: val }));
                          setCustomCategory('');
                        }
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    
                    {(newExpense.category === 'Others' || !CATEGORIES.map(c => c.value).includes(newExpense.category)) && (
                      <input
                        id="customCategory"
                        name="customCategory"
                        type="text"
                        required
                        placeholder="Enter custom category name (e.g. Software, Licensing)"
                        value={customCategory || (CATEGORIES.map(c => c.value).includes(newExpense.category) ? '' : newExpense.category)}
                        onChange={(e) => {
                          setCustomCategory(e.target.value);
                          setNewExpense(prev => ({ ...prev, category: e.target.value }));
                        }}
                        className="w-full px-4 py-3 mt-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20 animate-fade-in"
                      />
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <label htmlFor="expensePaidVia" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payment Method</label>
                    <select
                      id="expensePaidVia"
                      name="expensePaidVia"
                      value={newExpense.paidVia}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, paidVia: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer text-center disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer text-center disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Expense</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirmation Popup Modal */}
        <ConfirmModal
          isOpen={!!deleteExpenseId}
          onClose={() => setDeleteExpenseId(null)}
          onConfirm={handleConfirmDeleteExpense}
          title="Delete Expense"
          message="Are you sure you want to delete this expense? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="danger"
        />

        {/* Hidden PDF Printable Wrapper */}
        <div style={{ position: 'fixed', left: '-20000px', top: 0, opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -99999 }}>
          <div ref={printRef} className="p-8 w-[210mm] min-h-[295mm] bg-white font-sans text-xs text-slate-800 space-y-6 relative overflow-hidden">
            
            {/* Watermark logo */}
            {activeCompany?.watermarkLogo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                <img
                  src={activeCompany.watermarkLogo}
                  alt="Watermark"
                  className="w-96 h-96 object-contain opacity-[0.08] grayscale contrast-200"
                />
              </div>
            )}

            {/* Report Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                {activeCompany?.logo ? (
                  <img src={activeCompany.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain border p-1" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                    {activeCompany?.companyName ? activeCompany.companyName.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                <div>
                  <h1 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{activeCompany?.companyName || 'Expenses Report'}</h1>
                  <p className="text-[9px] text-slate-500">{activeCompany?.address}</p>
                  <p className="text-[9px] text-slate-500">Phone: {activeCompany?.phone} | Email: {activeCompany?.email}</p>
                  {activeCompany?.gstNumber && <p className="text-[9px] text-slate-500 font-mono">GSTIN: {activeCompany.gstNumber}</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-base font-black text-rose-600 uppercase tracking-wider">Expense Report</h2>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5">Project/Event: {selectedProject === 'all' ? 'All Projects & Events' : selectedProject}</p>
                <p className="text-[9px] text-slate-500 font-bold">Category: {selectedCategory === 'all' ? 'All Categories' : selectedCategory}</p>
                <p className="text-[8px] text-slate-400">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">Total Expenses Amount</p>
                <p className="text-xs font-black text-rose-600 mt-0.5">
                  {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0), currencySymbol)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">Total Item Count</p>
                <p className="text-xs font-black text-slate-900 mt-0.5">{filteredExpenses.length} transactions</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">Average Transaction Size</p>
                <p className="text-xs font-black text-blue-600 mt-0.5">
                  {formatCurrency(
                    filteredExpenses.length > 0 
                      ? filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / filteredExpenses.length 
                      : 0,
                    currencySymbol
                  )}
                </p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse text-[10px] relative z-10">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[8px]">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Particulars / Description</th>
                  <th className="py-2 px-3">Project / Event</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredExpenses.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-slate-500">{formatDate(row.date)}</td>
                    <td className="py-2 px-3 text-slate-700 font-semibold">{row.category}</td>
                    <td className="py-2 px-3 text-slate-800">{row.particulars}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[9px]">{row.projectEvent || 'General Office'}</td>
                    <td className="py-2 px-3 text-slate-500 uppercase text-[9px]">{row.paidVia || 'Cash'}</td>
                    <td className="py-2 px-3 text-right text-rose-600 font-extrabold">{formatCurrency(row.amount, currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="pt-12 flex justify-between relative z-10">
              <div>
                <p className="text-[8px] text-slate-400">Generated automatically | Verified ledger representation</p>
              </div>
              <div className="text-right border-t border-slate-300 pt-2 pr-6">
                <p className="font-extrabold text-slate-900">{activeCompany?.companyName}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Authorised Signatory</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Expenses;
