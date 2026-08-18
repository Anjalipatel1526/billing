import React, { useMemo, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { useCompany } from '../../contexts/CompanyContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/formatting';
import { useToast } from '../ui/Toast';
import { 
  getAllRecurringReminders, 
  saveRecurringReminder, 
  deleteRecurringReminder,
  getAllDocuments
} from '../../services/db';
import { 
  Bell, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Mail, 
  X, 
  Repeat, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Send
} from 'lucide-react';

export const RecurringRemindersSection = () => {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();

  const [reminders, setReminders] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('reminders'); // reminders | logs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  // Modal Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'income', // income | outcome
    amount: '',
    frequency: 'monthly', // daily | weekly | monthly | yearly
    nextDate: '',
    reminderDaysBefore: 1,
    emails: [],
    status: 'active'
  });

  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const currencySymbol = useMemo(() => {
    return activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';
  }, [activeCompany]);

  // Load reminders and simulated email logs
  const loadData = async () => {
    if (!activeCompany?.id) return;
    try {
      const data = await getAllRecurringReminders(activeCompany.id);
      setReminders(data);
    } catch (err) {
      console.error('Failed to load recurring reminders:', err);
      showToast('Error loading reminders', 'error');
    }

    // Load invoices
    try {
      const allDocs = await getAllDocuments(activeCompany.id);
      const invoiceDocs = allDocs.filter(doc => doc.documentType === 'invoice');
      setInvoices(invoiceDocs);
    } catch (err) {
      console.error('Failed to load documents/invoices:', err);
    }

    // Load logs from localStorage
    try {
      const storedLogs = localStorage.getItem(`simulated_email_logs_${activeCompany.id}`);
      if (storedLogs) {
        setEmailLogs(JSON.parse(storedLogs));
      } else {
        setEmailLogs([]);
      }
    } catch (e) {
      console.error('Failed to load email logs:', e);
    }
  };

  // Real Email Dispatch helper via EmailJS
  const sendRealEmail = async (reminder) => {
    if (!reminder.emails || reminder.emails.length === 0) return;

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_gmail';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_reminder';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!publicKey) {
      console.warn('EmailJS Public Key not configured. Real email dispatch skipped.');
      return;
    }

    try {
      const templateParams = {
        from_name: 'UNAI Billing Alerts',
        from_email: 'billinginvoice2026@gmail.com',
        to_email: reminder.emails.join(', '), // Standard EmailJS field name
        to_emails: reminder.emails.join(', '), // Plural fallback
        email: reminder.emails[0] || '',       // Singular email fallback
        bill_title: reminder.title,
        amount: formatCurrency(reminder.amount, currencySymbol),
        due_date: reminder.nextDate,
        bill_type: reminder.type === 'income' ? 'Income Inflow' : 'Expense Outflow',
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('Real email sent via EmailJS');
    } catch (err) {
      console.error('Failed to send real email via EmailJS:', err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompany?.id]);

  // Next Occurrence date calculation helper
  const calculateNextOccurrence = (currentDateStr, frequency) => {
    const date = new Date(currentDateStr);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  // Automated background checker to detect upcoming bills and trigger simulated email logs
  useEffect(() => {
    if (reminders.length === 0 || !activeCompany?.id) return;

    const checkAndTriggerReminders = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let logsUpdated = false;
      const updatedLogs = [...emailLogs];
      const remindersToUpdate = [];

      for (const reminder of reminders) {
        if (reminder.status !== 'active') continue;

        const nextDate = new Date(reminder.nextDate);
        nextDate.setHours(0, 0, 0, 0);

        // Calculate differences in days
        const timeDiff = nextDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Trigger notification if:
        // 1. Bill is due in less than or equal to reminderDaysBefore
        // 2. OR bill is overdue (daysDiff < 0)
        if (daysDiff <= reminder.reminderDaysBefore) {
          const logKey = `${reminder.id}_${reminder.nextDate}`;
          const alreadySent = updatedLogs.some(log => log.id === logKey);

          if (!alreadySent) {
            // Generate simulated email log
            const newLog = {
              id: logKey,
              reminderId: reminder.id,
              title: reminder.title,
              type: reminder.type,
              amount: reminder.amount,
              recipients: [...reminder.emails],
              dueDate: reminder.nextDate,
              sentAt: new Date().toISOString(),
              status: reminder.emails.length > 0 ? 'delivered' : 'failed_no_recipients'
            };

            updatedLogs.unshift(newLog);
            logsUpdated = true;

            // Trigger visual UI notification
            if (reminder.emails.length > 0) {
              showToast(`🔔 Email alert sent for "${reminder.title}" to ${reminder.emails[0]}`, 'info');
              sendRealEmail(reminder);
            } else {
              showToast(`⚠️ Reminder due for "${reminder.title}" but no recipient emails configured!`, 'warning');
            }

            // If the nextDate is already in the past, update the reminder's next date for its next cycle
            if (daysDiff < 0) {
              const newNextDate = calculateNextOccurrence(reminder.nextDate, reminder.frequency);
              remindersToUpdate.push({
                ...reminder,
                nextDate: newNextDate
              });
            }
          }
        }
      }

      if (logsUpdated) {
        setEmailLogs(updatedLogs);
        localStorage.setItem(`simulated_email_logs_${activeCompany.id}`, JSON.stringify(updatedLogs));
      }

      if (remindersToUpdate.length > 0) {
        for (const rem of remindersToUpdate) {
          await saveRecurringReminder(rem);
        }
        // Reload fresh reminders list
        const freshData = await getAllRecurringReminders(activeCompany.id);
        setReminders(freshData);
      }
    };

    checkAndTriggerReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, activeCompany?.id]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    let activeReminders = reminders.filter(r => r.status === 'active');
    let incomeCount = activeReminders.filter(r => r.type === 'income').length;
    let outcomeCount = activeReminders.filter(r => r.type === 'outcome').length;

    let projectedIncome = 0;
    let projectedOutcome = 0;

    activeReminders.forEach(r => {
      // Normalize monthly values
      let multiplier = 1;
      if (r.frequency === 'weekly') multiplier = 4.33;
      else if (r.frequency === 'daily') multiplier = 30;
      else if (r.frequency === 'yearly') multiplier = 1 / 12;

      const monthlyAmt = r.amount * multiplier;
      if (r.type === 'income') projectedIncome += monthlyAmt;
      else projectedOutcome += monthlyAmt;
    });

    // Find next upcoming reminder
    let nextReminder = null;
    let minDays = Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    activeReminders.forEach(r => {
      const nextDate = new Date(r.nextDate);
      nextDate.setHours(0, 0, 0, 0);
      const days = Math.ceil((nextDate - today) / (1000 * 3600 * 24));
      if (days >= 0 && days < minDays) {
        minDays = days;
        nextReminder = { ...r, daysRemaining: days };
      }
    });

    return {
      activeCount: activeReminders.length,
      incomeCount,
      outcomeCount,
      projectedIncome: formatCurrency(projectedIncome, currencySymbol),
      projectedOutcome: formatCurrency(projectedOutcome, currencySymbol),
      nextReminder
    };
  }, [reminders, currencySymbol]);

  // Open modal to add a new reminder
  const handleOpenAddModal = () => {
    setEditingReminder(null);
    setSelectedInvoiceId('');
    setFormData({
      title: '',
      type: 'income',
      amount: '',
      frequency: 'monthly',
      nextDate: new Date().toISOString().split('T')[0],
      reminderDaysBefore: 1,
      emails: [],
      status: 'active'
    });
    setEmailInput('');
    setEmailError('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal to edit existing reminder
  const handleOpenEditModal = (reminder) => {
    setEditingReminder(reminder);
    setSelectedInvoiceId('');
    setFormData({
      title: reminder.title,
      type: reminder.type,
      amount: reminder.amount.toString(),
      frequency: reminder.frequency,
      nextDate: reminder.nextDate,
      reminderDaysBefore: reminder.reminderDaysBefore,
      emails: [...reminder.emails],
      status: reminder.status
    });
    setEmailInput('');
    setEmailError('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle invoice dropdown selection and auto-fill details
  const handleInvoiceChange = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    if (!invoiceId) return;

    const selectedInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!selectedInvoice) return;

    // Fetch customer details
    const clientName = selectedInvoice.customer?.customerName || 'Client';
    const clientEmail = selectedInvoice.customer?.email || '';

    // Automatically build title
    const newTitle = `Invoice ${selectedInvoice.documentNumber} - ${clientName}`;
    
    // Automatically set nextDate to invoice's due_date (if present)
    const newNextDate = selectedInvoice.dueDate || new Date().toISOString().split('T')[0];

    // Build the emails array. Make sure not to duplicate.
    const updatedEmails = [...formData.emails];
    if (clientEmail && !updatedEmails.includes(clientEmail)) {
      updatedEmails.push(clientEmail);
    }

    setFormData(prev => ({
      ...prev,
      title: newTitle,
      amount: selectedInvoice.amount.toString(),
      nextDate: newNextDate,
      emails: updatedEmails
    }));
  };

  // Customize Option: Add a recipient email to the reminder
  const handleAddEmail = () => {
    setEmailError('');
    const email = emailInput.trim();
    if (!email) {
      setEmailError('Please enter an email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format.');
      return;
    }
    if (formData.emails.includes(email)) {
      setEmailError('Email is already added.');
      return;
    }
    setFormData({
      ...formData,
      emails: [...formData.emails, email]
    });
    setEmailInput('');
  };

  // Customize Option: Remove a recipient email from the reminder
  const handleRemoveEmail = (emailToRemove) => {
    setFormData({
      ...formData,
      emails: formData.emails.filter(e => e !== emailToRemove)
    });
  };

  // Toggle status directly from table
  const handleToggleStatus = async (reminder) => {
    const updated = {
      ...reminder,
      status: reminder.status === 'active' ? 'paused' : 'active'
    };
    try {
      await saveRecurringReminder(updated);
      showToast(`Reminder ${updated.status === 'active' ? 'activated' : 'paused'}`, 'success');
      loadData();
    } catch (e) {
      console.error('Failed to toggle status', e);
      showToast('Failed to update status', 'error');
    }
  };

  // Manual Trigger to Simulate/Send a test email reminder
  const handleSendTestEmail = (reminder) => {
    if (reminder.emails.length === 0) {
      showToast('Cannot send test email: no recipients configured', 'warning');
      return;
    }

    const hasRealEmailConfig = !!import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    sendRealEmail(reminder);

    const testLog = {
      id: `test_${reminder.id}_${Date.now()}`,
      reminderId: reminder.id,
      title: `${reminder.title} (Test Run)`,
      type: reminder.type,
      amount: reminder.amount,
      recipients: [...reminder.emails],
      dueDate: reminder.nextDate,
      sentAt: new Date().toISOString(),
      status: hasRealEmailConfig ? 'delivered' : 'simulated'
    };

    const updatedLogs = [testLog, ...emailLogs];
    setEmailLogs(updatedLogs);
    localStorage.setItem(`simulated_email_logs_${activeCompany.id}`, JSON.stringify(updatedLogs));
    
    if (hasRealEmailConfig) {
      showToast(`✉️ Real email sent to: ${reminder.emails.join(', ')}`, 'success');
    } else {
      showToast(`✉️ Simulated email dispatched to: ${reminder.emails.join(', ')} (Set VITE_EMAILJS_PUBLIC_KEY in .env for real emails)`, 'success');
    }
  };

  // Delete a reminder
  const handleDeleteReminder = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring reminder?')) {
      try {
        await deleteRecurringReminder(id);
        showToast('Recurring reminder deleted', 'success');
        loadData();
      } catch (e) {
        console.error('Failed to delete reminder', e);
        showToast('Failed to delete reminder', 'error');
      }
    }
  };

  // Submit Modal Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required.';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount is required.';
    if (!formData.nextDate) errors.nextDate = 'Next date is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const reminderData = {
      id: editingReminder ? editingReminder.id : `rec_${Date.now()}`,
      companyId: activeCompany.id,
      title: formData.title.trim(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      nextDate: formData.nextDate,
      reminderDaysBefore: parseInt(formData.reminderDaysBefore) || 1,
      emails: [...formData.emails],
      status: formData.status
    };

    try {
      await saveRecurringReminder(reminderData);
      showToast(editingReminder ? 'Recurring reminder updated' : 'Recurring reminder created', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error('Failed to save reminder', e);
      showToast('Failed to save reminder', 'error');
    }
  };

  // Clear simulated email history logs
  const handleClearLogs = () => {
    if (window.confirm('Clear all simulated email notification logs?')) {
      localStorage.removeItem(`simulated_email_logs_${activeCompany.id}`);
      setEmailLogs([]);
      showToast('Email logs cleared', 'success');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs">
        <div>
          <h1 className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-600 animate-spin-slow" />
            <span>Recurring Reminders</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Configure automated email notifications for recurring incomes (Invoices) and outcomes (Expenses).
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Recurring Reminder</span>
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Count */}
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
            <Bell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Templates</p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{analytics.activeCount}</h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
              {analytics.incomeCount} Inflow • {analytics.outcomeCount} Outflow
            </p>
          </div>
        </div>

        {/* Monthly Inflow */}
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
            <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Projected Inflow</p>
            <h3 className="text-lg font-black text-indigo-600 mt-0.5">{analytics.projectedIncome}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Recurring Invoices</p>
          </div>
        </div>

        {/* Monthly Outflow */}
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">
            <ArrowDownRight className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Projected Outflow</p>
            <h3 className="text-lg font-black text-rose-600 mt-0.5">{analytics.projectedOutcome}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Recurring Expenses</p>
          </div>
        </div>

        {/* Next Reminder */}
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Next Notification</p>
            {analytics.nextReminder ? (
              <>
                <h3 className="text-xs font-black text-slate-900 mt-0.5 truncate max-w-[120px]" title={analytics.nextReminder.title}>
                  {analytics.nextReminder.title}
                </h3>
                <p className="text-[9px] text-amber-600 font-bold mt-0.5">
                  {analytics.nextReminder.daysRemaining === 0 
                    ? 'Due Today!' 
                    : `In ${analytics.nextReminder.daysRemaining}d (${analytics.nextReminder.nextDate})`}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xs font-black text-slate-400 mt-0.5">None Scheduled</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Add recurring bills</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="border-b border-[#eff1f6] flex items-center justify-between">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'reminders' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active Reminders
            {activeTab === 'reminders' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'logs' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Simulated Mail Dispatch Logs
            {emailLogs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[8px] bg-red-155 text-red-750 font-extrabold rounded-full">
                {emailLogs.length}
              </span>
            )}
            {activeTab === 'logs' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'logs' && emailLogs.length > 0 && (
          <button
            type="button"
            onClick={handleClearLogs}
            className="text-[10px] text-rose-600 hover:underline font-bold pb-2.5 cursor-pointer"
          >
            Clear Logs
          </button>
        )}
      </div>

      {/* Active Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="bg-white border border-[#f1f3f9] rounded-2xl overflow-hidden shadow-xs">
          {reminders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xs">No Recurring Reminders</h3>
                <p className="text-slate-400 text-[10px] max-w-sm mx-auto">
                  Create automatic income billings or expense reminders to verify email dispatch simulations.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f3f9] bg-slate-50/50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Title / Particulars</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Next Due Date</th>
                    <th className="py-2.5 px-3">Recipients</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f9] text-[11px]">
                  {reminders.map((rem) => {
                    const daysLeft = Math.ceil((new Date(rem.nextDate) - new Date().setHours(0,0,0,0)) / (1000*3600*24));
                    const isOverdue = daysLeft < 0;

                    return (
                      <tr key={rem.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{rem.title}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                            rem.type === 'income' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {rem.type === 'income' ? 'Income' : 'Outcome'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          {formatCurrency(rem.amount, currencySymbol)}
                        </td>
                        <td className="py-3 px-3 capitalize font-semibold text-slate-650">{rem.frequency}</td>
                        <td className="py-3 px-3 font-semibold">
                          <div className="space-y-0.5">
                            <span className="text-slate-800">{rem.nextDate}</span>
                            <div className="text-[9px]">
                              {isOverdue ? (
                                <span className="text-rose-600 font-extrabold">Overdue!</span>
                              ) : daysLeft === 0 ? (
                                <span className="text-amber-600 font-extrabold">Due Today!</span>
                              ) : (
                                <span className="text-slate-400 font-medium">Due in {daysLeft}d</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {rem.emails.length === 0 ? (
                              <span className="text-[9px] text-slate-400 italic">No recipients</span>
                            ) : (
                              rem.emails.map((e, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold" title={e}>
                                  {e.split('@')[0]}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rem)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold cursor-pointer transition-colors border ${
                              rem.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-205 hover:bg-slate-200'
                            }`}
                          >
                            {rem.status === 'active' ? 'Active' : 'Paused'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendTestEmail(rem)}
                              className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Trigger Simulated Email Now"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(rem)}
                              className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Reminder"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Email Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-[#f1f3f9] rounded-2xl overflow-hidden shadow-xs">
          {emailLogs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xs">No Emails Sent Yet</h3>
                <p className="text-slate-400 text-[10px] max-w-sm mx-auto">
                  Dispatched simulated email notifications will appear here with recipient details and timing logs.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f3f9] bg-slate-50/50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Time Dispatched</th>
                    <th className="py-2.5 px-3">Subject / Bill</th>
                    <th className="py-2.5 px-3">Bill Type</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Recipients</th>
                    <th className="py-2.5 px-4 text-right">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f9] text-[11px]">
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-500">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        Upcoming bill due: {log.title}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          log.type === 'income' 
                            ? 'bg-indigo-50 text-indigo-650' 
                            : 'bg-rose-50 text-rose-650'
                        }`}>
                          {log.type === 'income' ? 'Income' : 'Outcome'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {formatCurrency(log.amount, currencySymbol)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-655">
                        {log.recipients.length > 0 
                          ? log.recipients.join(', ') 
                          : <span className="text-slate-400 italic">No recipients specified</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.status === 'delivered' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] font-bold border border-emerald-100">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[9px] font-bold border border-rose-100">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Form for Add/Edit Recurring Reminder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-blue-600" />
                {editingReminder ? 'Edit Recurring Reminder' : 'Add Recurring Reminder'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {/* Particulars Title */}
                <Input
                  id="reminderTitle"
                  name="reminderTitle"
                  label="Reminder Title / Particulars"
                  placeholder="e.g. Monthly Office Rent, Cloud Hosting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={formErrors.title}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Bill Type */}
                  <Select
                    id="reminderType"
                    name="reminderType"
                    label="Bill Type"
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({ ...formData, type: newType });
                      if (newType !== 'income') {
                        setSelectedInvoiceId('');
                      }
                    }}
                  >
                    <option value="income">Income (Incoming Bill / Invoice)</option>
                    <option value="outcome">Outcome (Outgoing Bill / Expense)</option>
                  </Select>

                  {/* Amount */}
                  <Input
                    id="reminderAmount"
                    name="reminderAmount"
                    label={`Amount (${currencySymbol})`}
                    type="number"
                    min="1"
                    placeholder="5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    error={formErrors.amount}
                    required
                  />
                </div>

                {/* Dynamic Invoice Auto-Fill Dropdown */}
                {formData.type === 'income' && invoices.length > 0 && (
                  <Select
                    id="reminderInvoice"
                    name="reminderInvoice"
                    label="Link Invoice (Optional Auto-Fill)"
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                  >
                    <option value="">-- Select an invoice to pre-populate details --</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.documentNumber} - {inv.customer?.customerName || 'Client'} ({formatCurrency(inv.amount, currencySymbol)})
                      </option>
                    ))}
                  </Select>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Frequency */}
                  <Select
                    id="reminderFrequency"
                    name="reminderFrequency"
                    label="Frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Select>

                  {/* Next Date */}
                  <Input
                    id="reminderNextDate"
                    name="reminderNextDate"
                    label="Next Bill Date"
                    type="date"
                    value={formData.nextDate}
                    onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                    error={formErrors.nextDate}
                    required
                  />
                </div>

                {/* Days before to alert */}
                <Select
                  id="reminderDaysBefore"
                  name="reminderDaysBefore"
                  label="Send Email Alert"
                  value={formData.reminderDaysBefore.toString()}
                  onChange={(e) => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) })}
                >
                  <option value="0">On the day of the bill</option>
                  <option value="1">1 day before due date</option>
                  <option value="3">3 days before due date</option>
                  <option value="5">5 days before due date</option>
                  <option value="7">1 week before due date</option>
                </Select>

                {/* Customize Email Recipients */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label htmlFor="recipientEmail" className="block text-[11px] font-bold text-slate-800">
                    Email Recipients <span className="text-[9px] text-slate-400 font-semibold">(Customize list)</span>
                  </label>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        id="recipientEmail"
                        name="recipientEmail"
                        type="email"
                        placeholder="e.g. accounts@firm.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        error={emailError}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 h-[34px] rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  {/* Recipient tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2 min-h-[36px] p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    {formData.emails.length === 0 ? (
                      <span className="text-[9px] text-slate-400 italic self-center px-1">No recipients configured. Add email above.</span>
                    ) : (
                      formData.emails.map((email, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-[10px] text-slate-700 font-bold pl-2.5 pr-1.5 py-1 rounded-full shadow-xs"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingReminder ? 'Save Changes' : 'Create Reminder'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
