import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { getCompanyEmployees, saveCompanyEmployees } from '../services/db';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  Lock, 
  User, 
  Plus, 
  Search, 
  X, 
  Check,
  AlertCircle,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

interface EmployeePermissions {
  viewDocuments: boolean;
  addInvoice: boolean;
  addVoucher: boolean;
  addReceipt: boolean;
  addExpense: boolean;
  viewLedger: boolean;
  accessRecycleBin: boolean;
  accessRecurringPayments: boolean;
}

interface Employee {
  id: string;
  name: string;
  loginId: string;
  password: string;
  phone?: string;
  email?: string;
  designation?: string;
  permissions: EmployeePermissions;
  isAdmin?: boolean;
  createdAt: string;
}

const defaultPermissions: EmployeePermissions = {
  viewDocuments: true,
  addInvoice: true,
  addVoucher: true,
  addReceipt: true,
  addExpense: true,
  viewLedger: true,
  accessRecycleBin: true,
  accessRecurringPayments: true
};

export const Employees = () => {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();

  // Guard: if employee is logged in, redirect or block access
  const employeeJson = localStorage.getItem('activeEmployee');
  const activeEmployee = employeeJson ? JSON.parse(employeeJson) : null;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<EmployeePermissions>({ ...defaultPermissions });
  const [isAdmin, setIsAdmin] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation state
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await getCompanyEmployees(activeCompany.id);
      setEmployees(data);
    } catch (e) {
      console.error('Error loading employees:', e);
      showToast('Failed to load employee list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeCompany, showToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingEmployeeId(null);
    setName('');
    setLoginId('');
    setPassword('');
    setPhone('');
    setEmail('');
    setDesignation('');
    setPermissions({ ...defaultPermissions });
    setIsAdmin(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setModalMode('edit');
    setEditingEmployeeId(emp.id);
    setName(emp.name);
    setLoginId(emp.loginId);
    setPassword(emp.password);
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setDesignation(emp.designation || '');
    setPermissions(emp.permissions || { ...defaultPermissions });
    setIsAdmin(!!emp.isAdmin);
    setFormError('');
    setIsModalOpen(true);
  };

  const validateForm = () => {
    if (!name.trim()) return 'Name is required.';
    if (!loginId.trim()) return 'Employee ID is required.';
    if (loginId.trim().includes(' ')) return 'Employee ID cannot contain spaces.';
    if (!password.trim()) return 'Password is required.';
    if (password.trim().length < 4) return 'Password must be at least 4 characters long.';
    
    // Check if login ID is already taken
    const exists = employees.some(
      emp => emp.loginId.toLowerCase() === loginId.trim().toLowerCase() && emp.id !== editingEmployeeId
    );
    if (exists) return 'This Employee ID is already in use.';

    return '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    if (!activeCompany) return;

    try {
      let updatedList = [...employees];
      if (modalMode === 'add') {
        const newEmployee: Employee = {
          id: `emp_${Date.now()}`,
          name: name.trim(),
          loginId: loginId.trim().toLowerCase(),
          password: password,
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          designation: designation.trim(),
          permissions,
          isAdmin,
          createdAt: new Date().toISOString()
        };
        updatedList.push(newEmployee);
        showToast(`Employee "${newEmployee.name}" created successfully!`, 'success');
      } else if (modalMode === 'edit' && editingEmployeeId) {
        updatedList = updatedList.map(emp => {
          if (emp.id === editingEmployeeId) {
            const updated = {
              ...emp,
              name: name.trim(),
              loginId: loginId.trim().toLowerCase(),
              password: password,
              phone: phone.trim(),
              email: email.trim().toLowerCase(),
              designation: designation.trim(),
              permissions,
              isAdmin
            };
            // Sync current logged-in employee session if updated
            const activeEmpJson = localStorage.getItem('activeEmployee');
            if (activeEmpJson) {
              const activeEmpObj = JSON.parse(activeEmpJson);
              if (activeEmpObj.id === emp.id) {
                localStorage.setItem('activeEmployee', JSON.stringify(updated));
              }
            }
            return updated;
          }
          return emp;
        });
        showToast('Employee settings updated successfully.', 'success');
      }

      await saveCompanyEmployees(activeCompany.id, updatedList);
      setEmployees(updatedList);
      setIsModalOpen(false);
    } catch (e) {
      console.error('Error saving employee:', e);
      showToast('Failed to save employee details.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteEmployeeId || !activeCompany) return;
    try {
      const updatedList = employees.filter(emp => emp.id !== deleteEmployeeId);
      await saveCompanyEmployees(activeCompany.id, updatedList);
      setEmployees(updatedList);
      showToast('Employee removed successfully.', 'success');
      setDeleteEmployeeId(null);
    } catch (e) {
      console.error('Error deleting employee:', e);
      showToast('Failed to delete employee.', 'error');
    }
  };

  const handleToggleAdmin = async (emp: Employee) => {
    if (!activeCompany) return;
    try {
      const updatedList = employees.map(e => {
        if (e.id === emp.id) {
          return {
            ...e,
            isAdmin: !e.isAdmin
          };
        }
        return e;
      });
      await saveCompanyEmployees(activeCompany.id, updatedList);
      setEmployees(updatedList);
      
      const updatedEmp = updatedList.find(e => e.id === emp.id);
      if (updatedEmp?.isAdmin) {
        showToast(`Employee "${emp.name}" is now an Admin with full access.`, 'success');
      } else {
        showToast(`Admin privileges revoked for "${emp.name}".`, 'info');
      }

      // Sync current logged-in employee session if updated
      const activeEmpJson = localStorage.getItem('activeEmployee');
      if (activeEmpJson) {
        const activeEmpObj = JSON.parse(activeEmpJson);
        if (activeEmpObj.id === emp.id && updatedEmp) {
          localStorage.setItem('activeEmployee', JSON.stringify(updatedEmp));
        }
      }
    } catch (e) {
      console.error('Error toggling admin status:', e);
      showToast('Failed to update admin status.', 'error');
    }
  };

  const handleTogglePermission = (key: keyof EmployeePermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (activeEmployee && !activeEmployee.isAdmin) {
    return (
      <MainLayout title="Access Control">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white border border-slate-100 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100/30">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
          <p className="text-slate-500 text-sm max-w-sm mt-1 leading-relaxed">
            Only the Workspace Owner or Administrator can access the Employee Management section.
          </p>
        </div>
      </MainLayout>
    );
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.loginId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout title="Employees">
      <div className="space-y-6 font-sans">
        
        {/* Top Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees by name, designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm transition-all shadow-xs"
            />
          </div>

          <Button
            onClick={handleOpenAddModal}
            icon={UserPlus}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-2xl px-5 py-2.5 text-sm font-bold shrink-0 self-start md:self-auto cursor-pointer"
          >
            Add Employee
          </Button>
        </div>

        {/* Employee Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-slate-100 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-slate-50 rounded-xl" />
                <div className="h-8 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-16 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-100">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-slate-900 font-bold text-sm">No Employees Registered</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              Create employee logins with granular access permissions to onboard your staff.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => {
              const activeCount = Object.values(emp.permissions || {}).filter(Boolean).length;
              const totalCount = Object.keys(defaultPermissions).length;
              const hasFullAccess = activeCount === totalCount;
              const hasNoAccess = activeCount === 0;

              return (
                <div key={emp.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-100/50 transition-all flex flex-col justify-between group">
                  <div className="space-y-4">
                    {/* Header Info */}
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm uppercase ${
                        emp.isAdmin 
                          ? 'bg-amber-50 border border-amber-100/60 text-amber-600' 
                          : 'bg-indigo-50 border border-indigo-100/40 text-indigo-600'
                      }`}>
                        {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate leading-tight group-hover:text-indigo-600 transition-colors">{emp.name}</h4>
                          {emp.isAdmin && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-bold shrink-0">
                              <Shield className="w-2.5 h-2.5 text-amber-500" />
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {emp.designation ? `${emp.designation} • ` : ''}Joined {new Date(emp.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Login & Info */}
                    <div className="bg-slate-50 border border-slate-100/40 rounded-xl p-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Employee ID:</span>
                        <span className="text-slate-800 font-mono font-bold">{emp.loginId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Password:</span>
                        <span className="text-slate-800 font-mono font-bold select-all">{emp.password}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-semibold">Phone:</span>
                          <span className="text-slate-700 font-medium">{emp.phone}</span>
                        </div>
                      )}
                      {emp.email && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-semibold">Email:</span>
                          <span className="text-slate-700 font-medium truncate max-w-[170px]" title={emp.email}>{emp.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Permissions Badges */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Feature Permissions</span>
                        <span className="text-[10px] font-bold text-indigo-600">
                          {emp.isAdmin ? 'Admin (Bypassed)' : hasFullAccess ? 'Full Access' : hasNoAccess ? 'No Access' : `${activeCount}/${totalCount} Active`}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 min-h-[60px] content-start">
                        {emp.isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold">
                            <Shield className="w-3 h-3 text-amber-600" />
                            Full Admin Control Granted
                          </span>
                        ) : hasFullAccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold">
                            <Shield className="w-3 h-3" />
                            All Permissions Granted
                          </span>
                        ) : hasNoAccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" />
                            No Permissions Enabled
                          </span>
                        ) : (
                          <>
                            {emp.permissions?.viewDocuments && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Documents</span>
                            )}
                            {emp.permissions?.addInvoice && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Add Invoices</span>
                            )}
                            {emp.permissions?.addVoucher && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Add Vouchers</span>
                            )}
                            {emp.permissions?.addReceipt && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Add Receipts</span>
                            )}
                            {emp.permissions?.addExpense && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Add Expenses</span>
                            )}
                            {emp.permissions?.viewLedger && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Ledger</span>
                            )}
                            {emp.permissions?.accessRecycleBin && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Recycle Bin</span>
                            )}
                            {emp.permissions?.accessRecurringPayments && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100/30 text-blue-600 text-[9px] font-bold">Recurring Payments</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => handleToggleAdmin(emp)}
                      className={`inline-flex items-center gap-1.5 font-bold text-xs transition-colors cursor-pointer mr-auto ${
                        emp.isAdmin 
                          ? 'text-amber-600 hover:text-amber-700' 
                          : 'text-slate-400 hover:text-amber-600'
                      }`}
                      title={emp.isAdmin ? "Revoke Admin Access" : "Make Admin"}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{emp.isAdmin ? 'Revoke Admin' : 'Make Admin'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-colors cursor-pointer"
                      title="Edit Employee"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteEmployeeId(emp.id)}
                      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal Card Centered */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative w-full max-w-xl bg-white/95 rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
              
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-none">
                      {modalMode === 'add' ? 'Add Employee' : 'Edit Employee'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Configure staff access and login credentials</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <form onSubmit={handleSave} className="space-y-5" autoComplete="off">
                  {/* Dummy inputs to intercept browser autofill */}
                  <input type="text" name="dummy-username" style={{ display: 'none' }} autoComplete="username" />
                  <input type="password" name="dummy-password" style={{ display: 'none' }} autoComplete="current-password" />
                  
                  {/* Basic Details Section */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Basic Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm transition-all"
                            required
                            autoComplete="new-name"
                            name="employee-full-name"
                          />
                        </div>
                      </div>

                      {/* Designation */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">Designation / Role</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Accountant"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm transition-all"
                            autoComplete="new-designation"
                            name="employee-designation"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +1 555 0199"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm transition-all"
                            autoComplete="new-phone"
                            name="employee-phone"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. john@example.com"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm transition-all"
                            autoComplete="new-email"
                            name="employee-email"
                          />
                        </div>
                      </div>

                      {/* Admin Access Toggle inside Modal */}
                      <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-amber-50/40 border border-amber-100/60 rounded-2xl mt-1">
                        <div className="flex gap-2.5 items-start">
                          <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800">Admin Privileges</span>
                            <p className="text-[10px] text-slate-500 leading-normal">Grant full system access and allow viewing all company documents/financial data.</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isAdmin}
                          onChange={(e) => setIsAdmin(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-650 focus:ring-amber-500/20 border-slate-350 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Credentials Section */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Login Credentials</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Login ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">Employee Login ID</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value.toLowerCase())}
                            placeholder="e.g. john.doe (no spaces)"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm transition-all font-mono"
                            required
                            disabled={modalMode === 'edit'}
                            autoComplete="new-username"
                            name="employee-login-id"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">Password</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Assign password (min 4 chars)"
                            className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm transition-all font-mono"
                            required
                            autoComplete="new-password"
                            name="employee-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Permissions Checklist Section */}
                  <div className="space-y-3">
                    <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider">Access Permissions</label>
                    
                    <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50/30 grid grid-cols-1 sm:grid-cols-2 divide-x-0 sm:divide-x border-collapse">
                      
                      {/* Document Viewer */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">View Documents</p>
                          <p className="text-[10px] text-slate-400 font-medium">Access document lists and previews</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.viewDocuments}
                          onChange={() => handleTogglePermission('viewDocuments')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                      {/* Add Invoice */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">Add Invoices</p>
                          <p className="text-[10px] text-slate-400 font-medium">Create invoices for customers</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.addInvoice}
                          onChange={() => handleTogglePermission('addInvoice')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                      {/* Add Voucher */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">Add Vouchers</p>
                          <p className="text-[10px] text-slate-400 font-medium">Generate credit/debit vouchers</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.addVoucher}
                          onChange={() => handleTogglePermission('addVoucher')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                      {/* Add Receipt */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">Add Receipts</p>
                          <p className="text-[10px] text-slate-400 font-medium">Record and issue payment receipts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.addReceipt}
                          onChange={() => handleTogglePermission('addReceipt')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                      {/* Add Expense */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100 sm:border-b-0">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">Add Expenses</p>
                          <p className="text-[10px] text-slate-400 font-medium">Create expense entries & vouchers</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.addExpense}
                          onChange={() => handleTogglePermission('addExpense')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                      {/* View Ledger */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100 sm:border-b-0">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">View Ledger</p>
                          <p className="text-[10px] text-slate-400 font-medium">Inspect books and particulars</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.viewLedger}
                          onChange={() => handleTogglePermission('viewLedger')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                      {/* Access Recycle Bin */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">Access Recycle Bin</p>
                          <p className="text-[10px] text-slate-400 font-medium">Restore deleted records</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.accessRecycleBin}
                          onChange={() => handleTogglePermission('accessRecycleBin')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                      {/* Access Recurring Payments */}
                      <label className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors cursor-pointer">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">Access Recurring Payments</p>
                          <p className="text-[10px] text-slate-400 font-medium">Manage recurring subscription reminders</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={permissions.accessRecurringPayments}
                          onChange={() => handleTogglePermission('accessRecurringPayments')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-350 mr-1"
                        />
                      </label>

                    </div>
                  </div>

                  {formError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                </form>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-3 p-5 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-bold shadow-md shadow-indigo-50 cursor-pointer"
                  onClick={handleSave}
                >
                  {modalMode === 'add' ? 'Create Login' : 'Save Changes'}
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteEmployeeId && (
          <ConfirmModal
            isOpen={true}
            title="Remove Employee Login"
            message="Are you sure you want to delete this employee? They will lose access immediately and all their manual credentials will be removed."
            onConfirm={handleDelete}
            onClose={() => setDeleteEmployeeId(null)}
            confirmText="Delete"
            confirmVariant="danger"
          />
        )}

      </div>
    </MainLayout>
  );
};
