import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * PDF export using browser print dialog as primary method,
 * with html2canvas + jsPDF as fallback.
 */
export async function downloadDocumentPDF(element, filename = 'document.pdf', orientation = 'portrait') {
  if (!element) {
    throw new Error('Element not provided for PDF export');
  }

  // Find the printable A4 element
  const printTarget = element.querySelector('#printable-document') || element;

  try {
    // ========================================
    // METHOD: Open in new window and use print
    // ========================================
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    if (!printWindow) {
      throw new Error('Popup blocked — falling back to html2canvas');
    }

    // Collect all stylesheets from the current page
    const styleSheets = Array.from(document.styleSheets);
    let cssText = '';
    
    for (const sheet of styleSheets) {
      try {
        if (sheet.href) {
          cssText += `<link rel="stylesheet" href="${sheet.href}">`;
        } else if (sheet.cssRules) {
          let rules = '';
          for (const rule of sheet.cssRules) {
            rules += rule.cssText + '\n';
          }
          cssText += `<style>${rules}</style>`;
        }
      } catch (e) {
        // Cross-origin stylesheets can't be accessed
        if (sheet.href) {
          cssText += `<link rel="stylesheet" href="${sheet.href}">`;
        }
      }
    }

    const isLandscape = orientation === 'landscape';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  ${cssText}
  <style>
    @page {
      size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
      margin: 0;
    }
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      -webkit-print-color-adjust: exact !important;
    }
    body {
      display: flex;
      justify-content: center;
      padding: 0;
    }
    #printable-document {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
    }
    @media print {
      html, body {
        width: ${isLandscape ? '297mm' : '210mm'};
        height: auto !important;
      }
      #printable-document {
        width: ${isLandscape ? '297mm' : '210mm'} !important;
        min-height: ${isLandscape ? '210mm' : '297mm'} !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  </style>
</head>
<body>
  ${printTarget.outerHTML}
  <script>
    // Auto-trigger print after content loads
    window.onload = function() {
      setTimeout(function() {
        window.print();
        // Close after print dialog (works in most browsers)
        setTimeout(function() { window.close(); }, 1000);
      }, 500);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    return true;

  } catch (popupError) {
    console.warn('[PDF] Print window method failed, using html2canvas fallback:', popupError.message);
    
    // ========================================
    // FALLBACK: html2canvas + jsPDF
    // ========================================
    return await generateWithCanvas(element, filename, orientation);
  }
}

/**
 * Fallback: html2canvas + jsPDF approach
 */
async function generateWithCanvas(element, filename, orientation) {
  const isLandscape = orientation === 'landscape';
  const printTarget = element.querySelector('#printable-document') || element;
  
  // Clone into a visible off-screen container
  const wrapper = document.createElement('div');
  wrapper.id = '__pdf_render__';
  wrapper.style.cssText = 'position:absolute;left:-20000px;top:0;background:white;opacity:1;visibility:visible;z-index:-99999;';
  document.body.appendChild(wrapper);

  try {
    const clone = printTarget.cloneNode(true);
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.margin = '0';
    clone.style.width = isLandscape ? '297mm' : '210mm';
    clone.style.minHeight = isLandscape ? '210mm' : '297mm';
    wrapper.appendChild(clone);

    await new Promise(r => setTimeout(r, 500));

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const scaledH = (canvas.height * pdfW) / canvas.width;

    if (scaledH <= pdfH + 1) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, scaledH);
    } else {
      const pageSliceH = Math.floor((pdfH / pdfW) * canvas.width);
      let y = 0, page = 0;
      while (y < canvas.height) {
        if (page > 0) pdf.addPage();
        const h = Math.min(pageSliceH, canvas.height - y);
        const c = document.createElement('canvas');
        c.width = canvas.width;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, pdfW, (h * pdfW) / canvas.width);
        y += pageSliceH;
        page++;
      }
    }

    const clean = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(clean);
    return true;

  } finally {
    const el = document.getElementById('__pdf_render__');
    if (el?.parentNode) el.parentNode.removeChild(el);
  }
}
