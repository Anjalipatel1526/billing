import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatting';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { InvoiceChart } from '../components/dashboard/InvoiceChart';
import { getAllExpenses, getAllRecurringReminders } from '../services/db';
import { 
  FileText, 
  Receipt, 
  CreditCard, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChevronDown,
  UserPlus,
  Megaphone,
  FolderOpen
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import GradientWaves from '../components/ui/GradientWaves';


// Helper component for count-up animation
const AnimatedCardValue = ({ targetValue, isCurrency, currencySymbol, duration = 1200, triggerKey }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0); // Reset immediately on trigger
    let startTimestamp = null;
    const startValue = 0;
    const endValue = parseFloat(targetValue) || 0;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Cubic ease-out
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setCurrent(startValue + easedProgress * (endValue - startValue));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetValue, duration, triggerKey]);

  if (isCurrency) {
    return formatCurrency(current, currencySymbol);
  }
  
  // Format standard integer count-up without decimals
  return Math.round(current).toLocaleString('en-IN');
};

// Helper component for circular progress with count-up animation
const CircularProgress = ({ 
  percent, 
  gradientId, 
  gradientStart, 
  gradientEnd, 
  trackColor, 
  size = 56, 
  strokeWidth = 5, 
  duration = 1200,
  triggerKey
}) => {
  const [currentPercent, setCurrentPercent] = useState(0);
  
  useEffect(() => {
    setCurrentPercent(0); // Reset immediately on trigger
    let startTimestamp = null;
    const startVal = 0;
    const endVal = Math.min(Math.max(parseFloat(percent) || 0, 0), 100);
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setCurrentPercent(startVal + easedProgress * (endVal - startVal));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [percent, duration, triggerKey]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentPercent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
        </defs>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all ease-out duration-100"
        />
      </svg>
      {/* Percentage Text centered */}
      <span className="absolute text-[11px] font-extrabold text-slate-800 tracking-tight">
        {Math.round(currentPercent)}%
      </span>
    </div>
  );
};

export const Dashboard = () => {
  const { activeCompany } = useCompany();
  const { documents } = useDocument();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const pdfRef = useRef(null);
  const [expenses, setExpenses] = useState([]);
  const [recurringReminders, setRecurringReminders] = useState([]);

  const [isWelcomeHovered, setIsWelcomeHovered] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Animation triggers for hover / touch events
  const [documentsTrigger, setDocumentsTrigger] = useState(0);
  const [invoicedTrigger, setInvoicedTrigger] = useState(0);
  const [overdueTrigger, setOverdueTrigger] = useState(0);
  const [recurringIncomeTrigger, setRecurringIncomeTrigger] = useState(0);
  const [recurringOutcomeTrigger, setRecurringOutcomeTrigger] = useState(0);
  const [expensesTrigger, setExpensesTrigger] = useState(0);

  const currencySymbol = useMemo(() => {
    return activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';
  }, [activeCompany]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!activeCompany?.id) return;
      try {
        const [expensesData, recurringData] = await Promise.all([
          getAllExpenses(activeCompany.id),
          getAllRecurringReminders(activeCompany.id)
        ]);
        setExpenses(expensesData);
        setRecurringReminders(recurringData);
      } catch (err) {
        console.error('Failed to load data for dashboard:', err);
      }
    };
    loadDashboardData();
  }, [activeCompany?.id, documents]);

  // Time based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  }, []);

  // Format relative time helper
  const getRelativeTime = (doc) => {
    if (doc.documentNumber === 'INV-2025-001') return '2h ago';
    if (doc.documentNumber === 'VCH-2025-002') return '4h ago';
    if (doc.documentNumber === 'RCP-2025-003') return '1d ago';
    
    const created = new Date(doc.createdAt || doc.documentDate);
    const diffMs = Date.now() - created.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Compute stat card values dynamically
  const stats = useMemo(() => {
    // Total documents count (all types)
    const totalDocsCount = documents.length;

    // Total Invoiced and Overdue calculation (invoices only)
    let invoiceDocs = documents.filter(d => d.documentType === 'invoice' || !d.documentType);
    let totalInv = 0;
    let overdueAmt = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoiceDocs.forEach(doc => {
      const amt = doc.totals?.grandTotal || parseFloat(doc.amount) || 0;
      totalInv += amt;

      const isStatusOverdue = doc.status === 'Overdue';
      const isPastDue = doc.dueDate && new Date(doc.dueDate) < today && doc.status !== 'Paid';
      if (isStatusOverdue || isPastDue) {
        overdueAmt += amt;
      }
    });

    // Recurring monthly income and outcome calculations
    let projectedIncome = 0;
    let projectedOutcome = 0;

    const activeReminders = recurringReminders.filter(r => r.status === 'active');
    activeReminders.forEach(r => {
      let multiplier = 1;
      if (r.frequency === 'weekly') multiplier = 4.33;
      else if (r.frequency === 'daily') multiplier = 30;
      else if (r.frequency === 'yearly') multiplier = 1 / 12;

      const monthlyAmt = (parseFloat(r.amount) || 0) * multiplier;
      if (r.type === 'income') {
        projectedIncome += monthlyAmt;
      } else {
        projectedOutcome += monthlyAmt;
      }
    });

    // Expenses total
    const totalExp = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    // Dynamic targets scaling
    const getDynamicTarget = (val, base) => {
      if (val <= 0) return base;
      let target = base;
      while (val > target) {
        target *= 2;
      }
      return target;
    };

    const targetDocs = getDynamicTarget(totalDocsCount, 10);
    const targetInvoiced = getDynamicTarget(totalInv, 500000);
    const targetOverdue = getDynamicTarget(overdueAmt, 50000);
    const targetRecIncome = getDynamicTarget(projectedIncome, 300000);
    const targetRecOutcome = getDynamicTarget(projectedOutcome, 100000);
    const targetExpenses = getDynamicTarget(totalExp, 100000);

    return {
      totalDocsVal: totalDocsCount,
      totalInvoicedVal: totalInv,
      overdueVal: overdueAmt,
      recurringIncomeVal: projectedIncome,
      recurringOutcomeVal: projectedOutcome,
      expensesVal: totalExp,
      
      totalDocsPercent: targetDocs > 0 ? Math.round((totalDocsCount / targetDocs) * 100) : 0,
      totalInvoicedPercent: targetInvoiced > 0 ? Math.round((totalInv / targetInvoiced) * 100) : 0,
      overduePercent: targetOverdue > 0 ? Math.round((overdueAmt / targetOverdue) * 100) : 0,
      recurringIncomePercent: targetRecIncome > 0 ? Math.round((projectedIncome / targetRecIncome) * 100) : 0,
      recurringOutcomePercent: targetRecOutcome > 0 ? Math.round((projectedOutcome / targetRecOutcome) * 100) : 0,
      expensesPercent: targetExpenses > 0 ? Math.round((totalExp / targetExpenses) * 100) : 0,
    };
  }, [documents, expenses, recurringReminders]);

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    e.currentTarget.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
  };

  return (
    <MainLayout title="Dashboard">
      {/* Full-Page Background GradientWaves */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <GradientWaves
          horizonColor="#f0f7fb"
          waveColor="#e0e7ff"
          crestColor="#eff6ff"
          speed={0.15}
          amplitude={1.8}
          waveScale={0.4}
          waveRatio={0.9}
          swell={25}
          turbulence={15}
          tilt={1.2}
          zoom={1.0}
          height={5.5}
          fogDepth={18}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={true}
          parallaxStrength={0.25}
          grain={false}
        />
      </div>

      <div className="space-y-6 font-sans relative z-10">
        
        {/* Welcome Section & Create Dropdown */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          <div 
            onMouseEnter={(e) => {
              setIsWelcomeHovered(true);
              setShowSpotlight(true);
              handlePointerMove(e);
            }}
            onMouseLeave={() => {
              setIsWelcomeHovered(false);
              setShowSpotlight(false);
            }}
            onMouseMove={handlePointerMove}
            onTouchStart={(e) => {
              setIsWelcomeHovered(true);
              setShowSpotlight(true);
              handlePointerMove(e);
            }}
            onTouchMove={handlePointerMove}
            onTouchEnd={() => {
              setTimeout(() => {
                setIsWelcomeHovered(false);
                setShowSpotlight(false);
              }, 1500);
            }}
            className="flex-1 bg-white border border-[#f1f3f9] p-6 rounded-3xl shadow-xs cursor-pointer select-none transition-all duration-300 hover:shadow-md relative overflow-hidden group"
          >
            {/* Theme-Matched Spotlight Overlay */}
            <div 
              className={`absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 ${
                showSpotlight ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(59, 42, 224, 0.08), transparent 80%)`,
                zIndex: 1
              }}
            />



            {/* Theme-Matched Rotating Border Beam (Hamour Line) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl" style={{ zIndex: 10 }}>
              <defs>
                <linearGradient id="welcome-beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b2ae0" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b2ae0" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <rect
                rx="24"
                fill="none"
                stroke="url(#welcome-beam-gradient)"
                strokeWidth="2.5"
                className="animate-border-beam welcome-border-rect"
              />
            </svg>

            {/* Welcome Card Content */}
            <div className="relative z-10">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{greeting}, {activeCompany?.companyName ? activeCompany.companyName.split(' ')[0] : 'Autobourn'}!</span>
                <span className={`inline-block transition-transform duration-300 ${isWelcomeHovered ? 'animate-wave-shake' : ''}`}>👋</span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Create and manage your business invoices, vouchers, and receipts easily.
              </p>
            </div>
          </div>

          <div className="relative shrink-0 flex items-center">
            <button
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className="w-full lg:w-auto flex items-center justify-between gap-4.5 bg-[#3b2ae0] hover:bg-[#3223c6] text-white font-extrabold text-xs py-3.5 px-5 rounded-2xl transition-all shadow-md shadow-indigo-100 active:scale-[0.98] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 stroke-[3px]" />
                Create Invoice
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {createMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#e2e8f0] py-2 z-50 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    navigate('/documents/new?type=invoice');
                    setCreateMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#eff6ff] hover:text-blue-600 transition-colors cursor-pointer"
                >
                  New Invoice
                </button>
                <button
                  onClick={() => {
                    navigate('/documents/new?type=voucher');
                    setCreateMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#eff6ff] hover:text-blue-600 transition-colors cursor-pointer"
                >
                  New Voucher
                </button>
                <button
                  onClick={() => {
                    navigate('/documents/new?type=receipt');
                    setCreateMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#eff6ff] hover:text-blue-600 transition-colors cursor-pointer"
                >
                  New Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards (6 Cards Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Total Documents */}
          <div 
            onMouseEnter={() => setDocumentsTrigger(prev => prev + 1)}
            onTouchStart={() => setDocumentsTrigger(prev => prev + 1)}
            onClick={() => navigate('/documents')}
            className="bg-white border border-[#f1f3f9] p-4 rounded-3xl shadow-xs flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <CircularProgress 
              percent={stats.totalDocsPercent}
              gradientId="blueProgress"
              gradientStart="#0ea5e9"
              gradientEnd="#2563eb"
              trackColor="#f0f9ff"
              triggerKey={documentsTrigger}
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[10px] xl:text-[11px] font-bold text-slate-500 truncate">Total Documents</span>
              <p className="text-sm xl:text-base font-extrabold text-slate-900 tracking-tight mt-0.5 whitespace-nowrap">
                <AnimatedCardValue targetValue={stats.totalDocsVal} isCurrency={false} currencySymbol={currencySymbol} triggerKey={documentsTrigger} />
              </p>
              <p className="text-[9px] xl:text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>
          
          {/* Card 2: Total Invoiced */}
          <div 
            onMouseEnter={() => setInvoicedTrigger(prev => prev + 1)}
            onTouchStart={() => setInvoicedTrigger(prev => prev + 1)}
            onClick={() => navigate('/documents?type=invoice')}
            className="bg-white border border-[#f1f3f9] p-4 rounded-3xl shadow-xs flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <CircularProgress 
              percent={stats.totalInvoicedPercent}
              gradientId="indigoProgress"
              gradientStart="#818cf8"
              gradientEnd="#4f46e5"
              trackColor="#f5f3ff"
              triggerKey={invoicedTrigger}
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[10px] xl:text-[11px] font-bold text-slate-500 truncate">Total Invoiced</span>
              <p className="text-sm xl:text-base font-extrabold text-slate-900 tracking-tight mt-0.5 whitespace-nowrap">
                <AnimatedCardValue targetValue={stats.totalInvoicedVal} isCurrency={true} currencySymbol={currencySymbol} triggerKey={invoicedTrigger} />
              </p>
              <p className="text-[9px] xl:text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>

          {/* Card 3: Overdue */}
          <div 
            onMouseEnter={() => setOverdueTrigger(prev => prev + 1)}
            onTouchStart={() => setOverdueTrigger(prev => prev + 1)}
            onClick={() => navigate('/documents?status=Overdue')}
            className="bg-white border border-[#f1f3f9] p-4 rounded-3xl shadow-xs flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <CircularProgress 
              percent={stats.overduePercent}
              gradientId="redProgress"
              gradientStart="#ef4444"
              gradientEnd="#b91c1c"
              trackColor="#fef2f2"
              triggerKey={overdueTrigger}
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[10px] xl:text-[11px] font-bold text-slate-500 truncate">Overdue</span>
              <p className="text-sm xl:text-base font-extrabold text-slate-900 tracking-tight mt-0.5 whitespace-nowrap">
                <AnimatedCardValue targetValue={stats.overdueVal} isCurrency={true} currencySymbol={currencySymbol} triggerKey={overdueTrigger} />
              </p>
              <p className="text-[9px] xl:text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>

          {/* Card 4: Recurring Income */}
          <div 
            onMouseEnter={() => setRecurringIncomeTrigger(prev => prev + 1)}
            onTouchStart={() => setRecurringIncomeTrigger(prev => prev + 1)}
            onClick={() => navigate('/recurring')}
            className="bg-white border border-[#f1f3f9] p-4 rounded-3xl shadow-xs flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <CircularProgress 
              percent={stats.recurringIncomePercent}
              gradientId="emeraldProgress"
              gradientStart="#34d399"
              gradientEnd="#059669"
              trackColor="#ecfdf5"
              triggerKey={recurringIncomeTrigger}
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[10px] xl:text-[11px] font-bold text-slate-500 truncate">Recurring Income</span>
              <p className="text-sm xl:text-base font-extrabold text-slate-900 tracking-tight mt-0.5 whitespace-nowrap">
                <AnimatedCardValue targetValue={stats.recurringIncomeVal} isCurrency={true} currencySymbol={currencySymbol} triggerKey={recurringIncomeTrigger} />
              </p>
              <p className="text-[9px] xl:text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>

          {/* Card 5: Recurring Outcome */}
          <div 
            onMouseEnter={() => setRecurringOutcomeTrigger(prev => prev + 1)}
            onTouchStart={() => setRecurringOutcomeTrigger(prev => prev + 1)}
            onClick={() => navigate('/recurring')}
            className="bg-white border border-[#f1f3f9] p-4 rounded-3xl shadow-xs flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <CircularProgress 
              percent={stats.recurringOutcomePercent}
              gradientId="amberProgress"
              gradientStart="#f59e0b"
              gradientEnd="#d97706"
              trackColor="#fffbeb"
              triggerKey={recurringOutcomeTrigger}
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[10px] xl:text-[11px] font-bold text-slate-500 truncate">Recurring Outcome</span>
              <p className="text-sm xl:text-base font-extrabold text-slate-900 tracking-tight mt-0.5 whitespace-nowrap">
                <AnimatedCardValue targetValue={stats.recurringOutcomeVal} isCurrency={true} currencySymbol={currencySymbol} triggerKey={recurringOutcomeTrigger} />
              </p>
              <p className="text-[9px] xl:text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>

          {/* Card 6: Expenses */}
          <div 
            onMouseEnter={() => setExpensesTrigger(prev => prev + 1)}
            onTouchStart={() => setExpensesTrigger(prev => prev + 1)}
            onClick={() => navigate('/expenses')}
            className="bg-white border border-[#f1f3f9] p-4 rounded-3xl shadow-xs flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <CircularProgress 
              percent={stats.expensesPercent}
              gradientId="roseProgress"
              gradientStart="#fb7185"
              gradientEnd="#e11d48"
              trackColor="#fff1f2"
              triggerKey={expensesTrigger}
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[10px] xl:text-[11px] font-bold text-slate-500 truncate">Expenses</span>
              <p className="text-sm xl:text-base font-extrabold text-slate-900 tracking-tight mt-0.5 whitespace-nowrap">
                <AnimatedCardValue targetValue={stats.expensesVal} isCurrency={true} currencySymbol={currencySymbol} triggerKey={expensesTrigger} />
              </p>
              <p className="text-[9px] xl:text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Chart & Recent Documents Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <InvoiceChart documents={documents} currencySymbol={currencySymbol} />
          </div>

          {/* Recent Documents Card */}
          <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Recent Documents</h3>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {documents.slice(0, 3).map((doc) => {
                  const isInvoice = doc.documentType === 'invoice';
                  const isVoucher = doc.documentType === 'voucher';
                  
                  const label = isInvoice ? 'Invoice' : isVoucher ? 'Voucher' : 'Receipt';
                  const partyName = doc.customer?.customerName || doc.paidTo || doc.receivedFrom || 'N/A';
                  const amount = doc.totals?.grandTotal || doc.amount || 0;
                  const timeAgo = getRelativeTime(doc);
                  
                  const iconBg = isInvoice ? 'bg-blue-50 text-blue-600' : isVoucher ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600';
                  const Icon = isInvoice ? FileText : isVoucher ? CreditCard : Receipt;

                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => navigate(`/documents?preview=${doc.id}`)}
                      className="py-3 px-2 -mx-2 flex items-center justify-between gap-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer group active:scale-[0.99]"
                      title="Click to view bill preview"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconBg}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {doc.documentNumber}
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                            {label} • {partyName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                          {formatCurrency(amount, currencySymbol)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Recent Activities</h3>
              <button
                onClick={() => navigate('/documents')}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">New invoice created</p>
                    <p className="text-[10px] text-slate-400 font-medium">INV-2025-001 for TechNova Solutions</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">2h ago</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Payment received</p>
                    <p className="text-[10px] text-slate-400 font-medium">₹23,150.00 from ABC Enterprises</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">4h ago</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Document uploaded</p>
                    <p className="text-[10px] text-slate-400 font-medium">GST Certificate - TechNova Solutions</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">6h ago</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Voucher created</p>
                    <p className="text-[10px] text-slate-400 font-medium">Office expenses voucher</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">1d ago</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight pb-3 border-b border-slate-100">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Create Admin</span>
              </button>

              <button
                onClick={() => navigate('/documents/new?type=invoice')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">New Invoice</span>
              </button>

              <button
                onClick={() => showToast('Announcement feature selected', 'info')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Add Announcement</span>
              </button>

              <button
                onClick={() => navigate('/documents')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Manage Files</span>
              </button>

              <button
                onClick={() => navigate('/ledger')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] sm:col-span-2"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">System Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#f1f3f9] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-bold gap-3">
          <div>
            © 2025 Autobourn Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Version 1.0.0</span>
            <a href="#whats-new" className="text-blue-600 hover:underline flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              What's New
            </a>
          </div>
        </div>

        {/* Hidden Render Container for PDF Download */}
        {pdfRenderDoc && (
          <div style={{ position: 'fixed', left: '-20000px', top: 0, opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -99999 }}>
            <div ref={pdfRef}>
              <TemplateWrapper
                templateName={pdfRenderDoc.template || activeCompany?.selectedTemplate}
                company={activeCompany}
                customer={pdfRenderDoc.customer}
                items={pdfRenderDoc.items || []}
                totals={pdfRenderDoc.totals || calculateTotals(pdfRenderDoc.items || [], pdfRenderDoc.discount)}
                document={pdfRenderDoc}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
