import { openDB } from 'idb';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DB_NAME = 'SaaSInvoiceDB';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('companies')) {
          const companyStore = db.createObjectStore('companies', { keyPath: 'id' });
          companyStore.createIndex('updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('companyId', 'companyId');
          docStore.createIndex('documentType', 'documentType');
          docStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    }).catch(err => {
      console.warn('IndexedDB failed to open, fallback to localStorage', err);
      return null;
    });
  }
  return dbPromise;
}

// Fallback LocalStorage Helpers
const LOCAL_STORAGE_KEYS = {
  COMPANIES: 'saas_billing_companies',
  DOCUMENTS: 'saas_billing_documents',
  ACTIVE_COMPANY: 'saas_billing_active_company_id'
};

function getLocalJSON(key, defaultVal = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.error('LocalStorage error', e);
    return defaultVal;
  }
}

function setLocalJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

// Data Mapping Helpers (CamelCase JS <-> SnakeCase Supabase)
function companyToRow(c) {
  return {
    id: c.id,
    company_name: c.companyName,
    business_type: c.businessType,
    logo: c.logo,
    watermark_logo: c.watermarkLogo,
    theme_color: c.themeColor,
    gst_number: c.gstNumber,
    pan_number: c.panNumber,
    email: c.email,
    phone: c.phone,
    website: c.website,
    address: c.address,
    city: c.city,
    state: c.state,
    country: c.country,
    pincode: c.pincode,
    cin: c.cin,
    udyam_number: c.udyamNumber,
    bank_details: c.bankDetails || {},
    invoice_prefix: c.invoicePrefix,
    invoice_start_number: c.invoiceStartNumber,
    voucher_prefix: c.voucherPrefix,
    voucher_start_number: c.voucherStartNumber,
    receipt_prefix: c.receiptPrefix,
    receipt_start_number: c.receiptStartNumber,
    default_tax: c.defaultTax,
    currency: c.currency,
    payment_terms: c.paymentTerms,
    notes: c.notes,
    payment_instructions: c.paymentInstructions,
    selected_template: c.selectedTemplate,
    company_code: c.companyCode,
    company_password: c.companyPassword,
    updated_at: c.updatedAt || new Date().toISOString(),
    created_at: c.createdAt || new Date().toISOString()
  };
}

function rowToCompany(r) {
  return {
    id: r.id,
    companyName: r.company_name,
    businessType: r.business_type,
    logo: r.logo,
    watermarkLogo: r.watermark_logo || r.watermarkLogo || '',
    themeColor: r.theme_color,
    gstNumber: r.gst_number,
    panNumber: r.pan_number,
    email: r.email,
    phone: r.phone,
    website: r.website,
    address: r.address,
    city: r.city,
    state: r.state,
    country: r.country,
    pincode: r.pincode,
    cin: r.cin,
    udyamNumber: r.udyam_number,
    bankDetails: r.bank_details || {},
    invoicePrefix: r.invoice_prefix,
    invoiceStartNumber: r.invoice_start_number,
    voucherPrefix: r.voucher_prefix,
    voucherStartNumber: r.voucher_start_number,
    receiptPrefix: r.receipt_prefix,
    receiptStartNumber: r.receipt_start_number,
    defaultTax: r.default_tax,
    currency: r.currency,
    paymentTerms: r.payment_terms,
    notes: r.notes,
    paymentInstructions: r.payment_instructions,
    selectedTemplate: r.selected_template,
    companyCode: r.company_code,
    companyPassword: r.company_password,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function docToRow(d) {
  return {
    id: d.id,
    company_id: d.companyId,
    document_number: d.documentNumber,
    document_type: d.documentType,
    document_date: d.documentDate,
    due_date: d.dueDate,
    status: d.status,
    customer: d.customer || {},
    items: d.items || [],
    totals: d.totals || {},
    paid_to: d.paidTo,
    received_from: d.receivedFrom,
    amount: d.amount || 0,
    template: d.template,
    notes: d.notes,
    terms: d.terms,
    discount: typeof d.discount === 'object' && d.discount !== null ? parseFloat(d.discount.value) || 0 : parseFloat(d.discount) || 0,
    updated_at: d.updatedAt || new Date().toISOString(),
    created_at: d.createdAt || new Date().toISOString()
  };
}

function rowToDoc(r) {
  return {
    id: r.id,
    companyId: r.company_id,
    documentNumber: r.document_number,
    documentType: r.document_type,
    documentDate: r.document_date,
    dueDate: r.due_date,
    status: r.status,
    customer: r.customer || {},
    items: r.items || [],
    totals: r.totals || {},
    paidTo: r.paid_to,
    receivedFrom: r.received_from,
    amount: r.amount,
    template: r.template,
    notes: r.notes,
    terms: r.terms,
    discount: typeof r.discount === 'number' ? { type: 'fixed', value: r.discount } : (r.discount || { type: 'percentage', value: 0 }),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

// ==========================================
// Service APIs (Supabase + Local Fallback)
// ==========================================

export async function getAllCompanies() {
  let list = [];
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        list = data.map(rowToCompany);
      } else if (error) {
        console.warn('Supabase getAllCompanies error:', error);
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    }
  }

  if (!list || list.length === 0) {
    const db = await getDB();
    if (db) {
      try {
        list = await db.getAll('companies');
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (!list || list.length === 0) {
    list = getLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, []);
  }

  // Deduplicate by ID and by normalized Company Name to eliminate duplicate business entries
  const seenIds = new Set();
  const seenNames = new Set();
  const uniqueCompanies = [];

  for (const c of list) {
    if (!c || !c.companyName) continue;
    const normName = c.companyName.trim().toLowerCase();
    
    if (!seenIds.has(c.id) && !seenNames.has(normName)) {
      seenIds.add(c.id);
      seenNames.add(normName);
      uniqueCompanies.push(c);
    }
  }

  return uniqueCompanies;
}

export async function getLocalCompanyIds() {
  const ids = new Set();
  const db = await getDB();
  if (db) {
    try {
      const locals = await db.getAll('companies');
      if (locals) {
        locals.forEach(c => { if (c && c.id) ids.add(c.id); });
      }
    } catch (e) {
      console.error(e);
    }
  }
  const lsLocals = getLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, []);
  if (lsLocals) {
    lsLocals.forEach(c => { if (c && c.id) ids.add(c.id); });
  }
  return Array.from(ids);
}

export async function saveCompany(company) {
  const now = new Date().toISOString();
  const companyData = {
    ...company,
    updatedAt: now,
    createdAt: company.createdAt || now
  };

  if (isSupabaseConfigured()) {
    try {
      const row = companyToRow(companyData);
      const { error } = await supabase.from('companies').upsert(row);
      if (error) console.error('Supabase saveCompany error:', error);
    } catch (e) {
      console.error('Supabase saveCompany catch:', e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      await db.put('companies', companyData);
    } catch (e) {
      console.error('IDB saveCompany error', e);
    }
  }

  // Backup to localStorage
  const list = getLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, []);
  const idx = list.findIndex(c => c.id === companyData.id);
  if (idx >= 0) {
    list[idx] = companyData;
  } else {
    list.push(companyData);
  }
  setLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, list);

  return companyData;
}

export async function deleteCompany(id) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('companies').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase deleteCompany error:', e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      await db.delete('companies', id);
    } catch (e) {
      console.error('IDB deleteCompany error', e);
    }
  }
  const list = getLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, []);
  const filtered = list.filter(c => c.id !== id);
  setLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, filtered);
}

export async function getActiveCompanyId() {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'activeCompanyId').single();
      if (data?.value) return data.value;
    } catch (e) {
      console.error(e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      const setting = await db.get('settings', 'activeCompanyId');
      if (setting) return setting.value;
    } catch (e) {
      console.error(e);
    }
  }
  return localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_COMPANY) || null;
}

export async function setActiveCompanyId(id) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('settings').upsert({ key: 'activeCompanyId', value: id, updated_at: new Date().toISOString() });
    } catch (e) {
      console.error('Supabase setActiveCompanyId error:', e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      await db.put('settings', { key: 'activeCompanyId', value: id });
    } catch (e) {
      console.error(e);
    }
  }
  if (id) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_COMPANY, id);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIVE_COMPANY);
  }
}

export async function getAllDocuments(companyId = null) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map(rowToDoc);
      }
      console.warn('Supabase getAllDocuments error:', error);
    } catch (e) {
      console.error('Supabase fetch documents catch:', e);
    }
  }

  const db = await getDB();
  let docs = [];
  if (db) {
    try {
      if (companyId) {
        docs = await db.getAllFromIndex('documents', 'companyId', companyId);
      } else {
        docs = await db.getAll('documents');
      }
    } catch (e) {
      console.error('IDB getAllDocuments error', e);
    }
  }
  if (!docs || docs.length === 0) {
    docs = getLocalJSON(LOCAL_STORAGE_KEYS.DOCUMENTS, []);
    if (companyId) {
      docs = docs.filter(d => d.companyId === companyId);
    }
  }
  return docs;
}

export async function saveDocument(document) {
  const now = new Date().toISOString();
  const docData = {
    ...document,
    updatedAt: now,
    createdAt: document.createdAt || now
  };

  if (isSupabaseConfigured()) {
    try {
      const row = docToRow(docData);
      const { error } = await supabase.from('documents').upsert(row);
      if (error) console.error('Supabase saveDocument error:', error);
    } catch (e) {
      console.error('Supabase saveDocument catch:', e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      await db.put('documents', docData);
    } catch (e) {
      console.error('IDB saveDocument error', e);
    }
  }

  // Backup to localStorage
  const list = getLocalJSON(LOCAL_STORAGE_KEYS.DOCUMENTS, []);
  const idx = list.findIndex(d => d.id === docData.id);
  if (idx >= 0) {
    list[idx] = docData;
  } else {
    list.push(docData);
  }
  setLocalJSON(LOCAL_STORAGE_KEYS.DOCUMENTS, list);

  return docData;
}

export async function getDocumentById(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('documents').select('*').eq('id', id).single();
      if (data) return rowToDoc(data);
    } catch (e) {
      console.error(e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      const doc = await db.get('documents', id);
      if (doc) return doc;
    } catch (e) {
      console.error(e);
    }
  }
  const list = getLocalJSON(LOCAL_STORAGE_KEYS.DOCUMENTS, []);
  return list.find(d => d.id === id) || null;
}

export async function deleteDocument(id) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('documents').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase deleteDocument error:', e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      await db.delete('companies', id);
    } catch (e) {
      console.error('IDB deleteDocument error', e);
    }
  }
  const list = getLocalJSON(LOCAL_STORAGE_KEYS.DOCUMENTS, []);
  const filtered = list.filter(d => d.id !== id);
  setLocalJSON(LOCAL_STORAGE_KEYS.DOCUMENTS, filtered);
}

export async function clearAllData() {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('documents').delete().neq('id', '');
      await supabase.from('companies').delete().neq('id', '');
      await supabase.from('settings').delete().neq('key', '');
    } catch (e) {
      console.error('Supabase clearAllData error:', e);
    }
  }

  const db = await getDB();
  if (db) {
    try {
      await db.clear('companies');
      await db.clear('documents');
      await db.clear('settings');
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.removeItem(LOCAL_STORAGE_KEYS.COMPANIES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.DOCUMENTS);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIVE_COMPANY);
}

/**
 * Looks up a company by its unique join code and verifies the password.
 * Returns the company object on success, or throws on failure.
 */
export async function joinCompanyByCode(code, password) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Join Company requires a cloud connection.');
  }

  const sanitizedCode = code.replace(/^#\s*/, '').trim().toUpperCase();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('company_code', sanitizedCode)
    .single();

  if (error || !data) {
    throw new Error('Company not found. Please check the Company ID and try again.');
  }

  if (data.company_password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const company = rowToCompany(data);

  // Save locally so the user has it cached
  const db = await getDB();
  if (db) {
    try { await db.put('companies', company); } catch (e) { console.error(e); }
  }
  const list = getLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, []);
  if (!list.find(c => c.id === company.id)) {
    list.push(company);
    setLocalJSON(LOCAL_STORAGE_KEYS.COMPANIES, list);
  }

  return company;
}

