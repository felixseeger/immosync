import { jsPDF } from 'jspdf';
import type { Property } from '../types';
import type { ReportSnapshot } from './reportPromptBuilder';
import { imageUrlToBase64, getSiteSyncLogoBase64, getFormatFromDataUrl } from './brochurePdf';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - (MARGIN * 2);

function formatEur(value: number): string {
  return `€${value.toLocaleString('de-DE')}`;
}

export async function generateDashboardReportPdf(
  snapshot: ReportSnapshot,
  properties: Property[]
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logoBase64 = await getSiteSyncLogoBase64();
  const dateStr = new Date(snapshot.exportedAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // --- Header ---
  doc.addImage(logoBase64, 'PNG', MARGIN, MARGIN, 15, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(11, 22, 34); // Navy 950
  doc.text('Performance Report', MARGIN + 20, MARGIN + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(136, 153, 170); // Secondary
  doc.text(dateStr, PAGE_W - MARGIN, MARGIN + 10, { align: 'right' });

  // --- Key Metrics Grid ---
  let y = MARGIN + 30;
  doc.setDrawColor(217, 255, 0); // Accent Lime
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  
  y += 15;
  const metrics = [
    { label: 'PORTFOLIO VALUE', value: formatEur(snapshot.portfolioValue) },
    { label: 'ACTIVE LISTINGS', value: String(snapshot.activeListings) },
    { label: 'TOTAL CONTACTS', value: String(snapshot.contactsCount) },
    { label: 'ACTIVE DEALS', value: String(snapshot.activeDealsCount) }
  ];

  const colW = CONTENT_W / 4;
  metrics.forEach((m, i) => {
    const x = MARGIN + (i * colW);
    doc.setFontSize(8);
    doc.setTextColor(136, 153, 170);
    doc.text(m.label, x, y);
    doc.setFontSize(14);
    doc.setTextColor(11, 22, 34);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, x, y + 7);
  });

  y += 25;
  doc.setFontSize(16);
  doc.text('Property Inventory', MARGIN, y);
  y += 10;

  // --- Pre-load Images ---
  const imagePromises = properties.map(async prop => {
    try {
      const imgUrl = prop.mainImage || (prop.images && prop.images[0]);
      if (!imgUrl) return null;
      return await imageUrlToBase64(imgUrl);
    } catch (err) {
      console.warn('Failed to load image for report:', prop.title, err);
      return null;
    }
  });
  const propertyImages = await Promise.all(imagePromises);

  // --- Property List ---
  properties.forEach((prop, idx) => {
    if (y > PAGE_H - 40) {
      doc.addPage();
      y = MARGIN;
    }

    // Border/Separator
    doc.setDrawColor(232, 238, 245);
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5;

    // Image
    const base64 = propertyImages[idx];
    if (base64) {
      try {
        const format = getFormatFromDataUrl(base64);
        doc.addImage(base64, format, MARGIN, y, 35, 25, undefined, 'FAST');
      } catch (err) {
        console.warn('jsPDF addImage failed:', err);
        doc.setDrawColor(200, 200, 200);
        doc.rect(MARGIN, y, 35, 25, 'S');
      }
    } else {
      doc.setDrawColor(240, 240, 240);
      doc.rect(MARGIN, y, 35, 25, 'S');
    }

    // Details
    const textX = MARGIN + 40;
    doc.setFontSize(11);
    doc.setTextColor(11, 22, 34);
    doc.setFont('helvetica', 'bold');
    doc.text(prop.title, textX, y + 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(78, 96, 112); // Muted
    doc.text(prop.address || 'No address', textX, y + 11);
    
    doc.setFontSize(10);
    doc.setTextColor(11, 22, 34);
    doc.text(`${formatEur(prop.price)}  |  ${prop.rooms || '-'} Rooms  |  ${prop.status}`, textX, y + 18);

    y += 35;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(136, 153, 170);
    doc.text(`SiteSync Intelligence — Page ${i} of ${pageCount}`, PAGE_W / 2, PAGE_H - 10, { align: 'center' });
  }

  return doc;
}
