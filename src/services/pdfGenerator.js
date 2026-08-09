import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * High-quality client-side PDF export generator using html2canvas and jsPDF
 * @param {HTMLElement} element - The DOM element containing the printable document
 * @param {string} filename - Desired filename for download
 * @param {string} orientation - 'portrait' or 'landscape'
 */
export async function downloadDocumentPDF(element, filename = 'document.pdf', orientation = 'portrait') {
  if (!element) {
    throw new Error('Element not provided for PDF export');
  }

  try {
    const isLandscape = orientation === 'landscape';

    // Save original styles if needed
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution crisp rendering
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: isLandscape ? 1400 : 1200
    });

    element.style.boxShadow = originalShadow;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm (portrait) or 297mm (landscape)
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm (portrait) or 210mm (landscape)
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;

    const xMargin = (pdfWidth - renderWidth) / 2;
    const yMargin = (pdfHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xMargin, yMargin > 0 ? yMargin : 0, renderWidth, renderHeight);
    
    let heightLeft = imgHeight * (pdfWidth / imgWidth) - pdfHeight;
    let position = -pdfHeight;

    while (heightLeft > 5) {
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', xMargin, position, renderWidth, renderHeight);
      heightLeft -= pdfHeight;
      position -= pdfHeight;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}
