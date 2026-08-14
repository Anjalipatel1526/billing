import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../components/ui/Toast';
import { 
  getAllExpenses, 
  saveExpense, 
  deleteExpense 
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
  Filter 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatting';

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
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const loadExpenses = async () => {
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
  };

  const handleLoadMockExpenses = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const mockData = [
        {
          id: 'mock_exp_1',
          companyId: activeCompany.id,
          particulars: 'AWS Cloud Hosting Subscriptions',
          amount: 14500,
          category: 'Utilities',
          date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
          projectEvent: 'Product Launch Q3',
          paidVia: 'Card'
        },
        {
          id: 'mock_exp_2',
          companyId: activeCompany.id,
          particulars: 'Ergonomic Office Chairs (Set of 4)',
          amount: 8200,
          category: 'Office Supplies',
          date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
          projectEvent: 'Office Upgrade',
          paidVia: 'Cash'
        },
        {
          id: 'mock_exp_3',
          companyId: activeCompany.id,
          particulars: 'Meta Ads Q3 Lead Campaign',
          amount: 18000,
          category: 'Marketing',
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          projectEvent: 'Marketing Campaign',
          paidVia: 'UPI'
        },
        {
          id: 'mock_exp_4',
          companyId: activeCompany.id,
          particulars: 'Senior Dev Wages (Contractual)',
          amount: 85000,
          category: 'Salaries',
          date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
          projectEvent: 'Product Launch Q3',
          paidVia: 'Bank Transfer'
        },
        {
          id: 'mock_exp_5',
          companyId: activeCompany.id,
          particulars: 'Delhi Client Onsite Meet (Hotel & Flight)',
          amount: 6800,
          category: 'Travel',
          date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
          projectEvent: 'Client Meet Delhi',
          paidVia: 'Card'
        },
        {
          id: 'mock_exp_6',
          companyId: activeCompany.id,
          particulars: 'Team Launch Celebrations Dinner',
          amount: 3200,
          category: 'Food & Refreshment',
          date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
          projectEvent: 'Office Upgrade',
          paidVia: 'UPI'
        },
        {
          id: 'mock_exp_7',
          companyId: activeCompany.id,
          particulars: 'Broadband Fiber Internet Bill',
          amount: 1500,
          category: 'Utilities',
          date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
          projectEvent: '',
          paidVia: 'Bank Transfer'
        },
        {
          id: 'mock_exp_8',
          companyId: activeCompany.id,
          particulars: 'Main HQ Office Rental (August)',
          amount: 45000,
          category: 'Rent',
          date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
          projectEvent: '',
          paidVia: 'Bank Transfer'
        }
      ];

      for (const item of mockData) {
        await saveExpense(item);
      }

      showToast('Mock expenses populated successfully!', 'success');
      const data = await getAllExpenses(activeCompany.id);
      setExpenses(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load mock expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeCompany?.id]);

  // List of unique projects for filter panel
  const uniqueProjects = useMemo(() => {
    const projects = expenses
      .map(e => e.projectEvent?.trim())
      .filter(p => !!p);
    return Array.from(new Set(projects));
  }, [expenses]);

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
      const matchesProject = selectedProject === 'all' || e.projectEvent === selectedProject;
      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [expenses, searchTerm, selectedCategory, selectedProject]);

  // Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.particulars.trim() || !newExpense.amount) {
      showToast('Please fill in particulars and amount', 'warning');
      return;
    }

    try {
      const payload = {
        ...newExpense,
        id: `exp_${Date.now()}`,
        companyId: activeCompany.id,
        amount: parseFloat(newExpense.amount)
      };

      await saveExpense(payload);
      showToast('Expense added successfully!', 'success');
      setIsModalOpen(false);
      
      // Reset form
      setNewExpense({
        particulars: '',
        amount: '',
        category: 'Office Supplies',
        date: new Date().toISOString().split('T')[0],
        projectEvent: '',
        paidVia: 'Cash'
      });
      loadExpenses();
    } catch (err) {
      console.error(err);
      showToast('Failed to save expense', 'error');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpense(id);
      showToast('Expense deleted successfully', 'success');
      loadExpenses();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete expense', 'error');
    }
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Expense</span>
          </button>
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
                type="text"
                placeholder="Search description, project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Project/Event Dropdown */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
            >
              <option value="all">All Projects & Events</option>
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
              {expenses.length === 0 && !loading && (
                <button
                  type="button"
                  onClick={handleLoadMockExpenses}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-blue-100/50"
                >
                  Load Mock Expenses
                </button>
              )}
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
                        {expenses.length === 0 && (
                          <button
                            type="button"
                            onClick={handleLoadMockExpenses}
                            className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-extrabold transition-all cursor-pointer border border-blue-100/50"
                          >
                            Populate Mock Expenses
                          </button>
                        )}
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
                {/* Particulars */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Particulars / Description</label>
                  <input
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amount ({currencySymbol})</label>
                    <input
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date</label>
                    <input
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payment Method</label>
                    <select
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

                {/* Project / Event tag */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Project / Event Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Meet 2026, Q3 Campaign"
                    value={newExpense.projectEvent}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, projectEvent: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/20"
                  />
                  <p className="text-[9px] text-slate-400">Add a project tag to easily filter expenses for specific business operations.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default Expenses;
