import { getAllCompanies, getAllDocuments, saveCompany, saveDocument, getActiveCompanyId, setActiveCompanyId } from '../services/db';

export async function exportAllDataAsJSON() {
  const companies = await getAllCompanies();
  const documents = await getAllDocuments();
  const activeCompanyId = await getActiveCompanyId();

  const backupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    activeCompanyId,
    companies,
    documents
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateTag = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `SaaS_Billing_Backup_${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDataFromJSON(jsonFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result);
        if (!content || typeof content !== 'object') {
          throw new Error('Invalid JSON backup file structure.');
        }

        if (Array.isArray(content.companies)) {
          for (const company of content.companies) {
            await saveCompany(company);
          }
        }

        if (Array.isArray(content.documents)) {
          for (const doc of content.documents) {
            await saveDocument(doc);
          }
        }

        if (content.activeCompanyId) {
          await setActiveCompanyId(content.activeCompanyId);
        }

        resolve({
          companiesCount: content.companies ? content.companies.length : 0,
          documentsCount: content.documents ? content.documents.length : 0
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(jsonFile);
  });
}
