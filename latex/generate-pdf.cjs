const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

// --- Load property data ---
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'property-data.json'), 'utf-8')
);

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();
const margin = 20;
const contentW = pageW - 2 * margin;

// Colors
const primary = [30, 58, 95];       // dark navy
const accent  = [0, 122, 204];      // blue accent
const gray    = [100, 100, 100];
const lightBg = [245, 247, 250];

let y = margin;

// ─── Helper functions ────────────────────────────────────────
function addText(text, x, size, color, style) {
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.setFont('helvetica', style || 'normal');
  doc.text(text, x, y);
}

function hr(yPos) {
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageW - margin, yPos);
}

function checkPage(needed) {
  if (y + needed > pageH - margin) {
    doc.addPage();
    y = margin;
  }
}

function sectionTitle(title) {
  checkPage(20);
  y += 6;
  hr(y);
  y += 8;
  addText(title, margin, 14, primary, 'bold');
  y += 8;
}

function drawTable(rows, opts) {
  const { hasHeader, startY, labelW } = Object.assign({ hasHeader: false, startY: y, labelW: 55 }, opts);
  const valW = contentW - labelW;
  const rowH = 8;
  const pad = 3;
  let ty = startY;

  rows.forEach((row, i) => {
    const isHeader = hasHeader && i === 0;
    checkPage(rowH + 2);

    // Row background
    if (isHeader) {
      doc.setFillColor(...primary);
      doc.rect(margin, ty, contentW, rowH, 'F');
    } else if (i % 2 === (hasHeader ? 1 : 0)) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, ty, contentW, rowH, 'F');
    }

    // Text
    const textY = ty + rowH - pad;
    if (isHeader) {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold');
    }
    doc.setFontSize(10);
    doc.text(String(row[0]), margin + pad, textY);

    doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
    doc.text(String(row[1]), margin + labelW + pad, textY);

    // Bottom border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, ty + rowH, margin + contentW, ty + rowH);

    ty += rowH;
  });
  y = ty + 2;
}

// Format helpers
const euro = (v) => v != null ? v.toLocaleString('de-DE') + ' €' : '–';
const num  = (v) => v != null ? v.toLocaleString('de-DE') : '–';

// ═══════════════════════════════════════════════════════════════
// PAGE 1 – TITLE
// ═══════════════════════════════════════════════════════════════

// Top accent bar
doc.setFillColor(...primary);
doc.rect(0, 0, pageW, 8, 'F');

y = 28;

// "EXPOSÉ" label
doc.setFontSize(11);
doc.setTextColor(...accent);
doc.setFont('helvetica', 'bold');
doc.text('EXPOSÉ', margin, y);
y += 10;

// Property title
doc.setFontSize(26);
doc.setTextColor(...primary);
doc.setFont('helvetica', 'bold');
const titleText = data.title || `${data.street} ${data.houseNumber}`;
doc.text(titleText, margin, y);
y += 8;

// Address subtitle
doc.setFontSize(11);
doc.setTextColor(...gray);
doc.setFont('helvetica', 'normal');
doc.text(data.address || '', margin, y);
y += 4;

hr(y);
y += 12;

// ─── Quick Facts Box ─────────────────────────────────────────
doc.setFillColor(...lightBg);
doc.roundedRect(margin, y, contentW, 32, 3, 3, 'F');

const boxY = y + 8;
const cols = 4;
const colW = contentW / cols;

const quickFacts = [
  { label: 'Kaltmiete',    value: euro(data.price) },
  { label: 'Wohnfläche',   value: `${num(data.livingSpace)} m²` },
  { label: 'Zimmer',       value: num(data.rooms) },
  { label: 'Objektart',    value: data.propertyType === 'Apartment' ? 'Wohnung' : data.propertyType },
];

quickFacts.forEach((f, i) => {
  const cx = margin + i * colW + colW / 2;
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text(f.label, cx, boxY, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.text(f.value, cx, boxY + 10, { align: 'center' });
});

y += 40;

// ═══════════════════════════════════════════════════════════════
// SECTION – Objektbeschreibung
// ═══════════════════════════════════════════════════════════════
sectionTitle('Objektbeschreibung');

const descText = data.description && data.description.trim()
  ? data.description
  : `Attraktive ${data.rooms}-Zimmer-Wohnung in ${data.city}-Oberkassel mit ${num(data.livingSpace)} m² Wohnfläche. `
    + `Die Wohnung verfügt über ${data.bedrooms} Schlafzimmer, ${data.bathrooms} Badezimmer `
    + `sowie einen Balkon und eine Garage. `
    + `Sie befindet sich in einer erstklassigen Lage und bietet eine hervorragende Anbindung an den öffentlichen Nahverkehr.`;

doc.setFontSize(10);
doc.setTextColor(...gray);
doc.setFont('helvetica', 'normal');
const descLines = doc.splitTextToSize(descText, contentW);
doc.text(descLines, margin, y);
y += descLines.length * 5 + 2;

// ═══════════════════════════════════════════════════════════════
// SECTION – Ausstattung
// ═══════════════════════════════════════════════════════════════
sectionTitle('Ausstattung');

const features = [];
if (data.balconies > 0) features.push(`${data.balconies} Balkon(e)`);
if (data.garage > 0)    features.push(`${data.garage} Garage(n)`);
if (data.bathtubs > 0)  features.push(`${data.bathtubs} Badewanne(n)`);
if (data.heatingType)   features.push(data.heatingType === 'Central Heating' ? 'Zentralheizung' : data.heatingType);
if (data.energyCertificate) features.push(`Energieausweis: ${data.energyCertificate} kWh/m²a`);

const featureCols = 2;
const fColW = contentW / featureCols;
features.forEach((f, i) => {
  const col = i % featureCols;
  const row = Math.floor(i / featureCols);
  const fx = margin + col * fColW + 4;
  const fy = y + row * 7;
  doc.setFontSize(10);
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'normal');
  doc.text('•  ' + f, fx, fy);
});
y += Math.ceil(features.length / featureCols) * 7 + 2;

// ═══════════════════════════════════════════════════════════════
// SECTION – Objektdaten (Table)
// ═══════════════════════════════════════════════════════════════
sectionTitle('Objektdaten');

const tableData = [
  ['Kaltmiete',          euro(data.price)],
  ['Nebenkosten',        euro(data.additionalCosts)],
  ['Warmmiete',          euro((data.price || 0) + (data.additionalCosts || 0))],
  ['Kaution/Provision',  euro(data.commission)],
  ['Wohnfläche',         `${num(data.livingSpace)} m²`],
  ['Grundstück',         data.lotSize > 0 ? `${num(data.lotSize)} m²` : '–'],
  ['Zimmer',             num(data.rooms)],
  ['Schlafzimmer',       num(data.bedrooms)],
  ['Badezimmer',         num(data.bathrooms)],
  ['Baujahr',            data.yearBuilt > 0 ? String(data.yearBuilt) : '–'],
  ['Objektart',          data.propertyType === 'Apartment' ? 'Wohnung' : data.propertyType],
  ['Vermarktungsart',    data.marketingType === 'Rent' ? 'Miete' : 'Kauf'],
  ['Heizung',            data.heatingType === 'Central Heating' ? 'Zentralheizung' : (data.heatingType || '–')],
  ['Energieausweis',     data.energyCertificate ? `${data.energyCertificate} kWh/m²a` : '–'],
  ['Status',             data.status === 'Active' ? 'Aktiv' : data.status],
];

drawTable([['Eigenschaft', 'Wert'], ...tableData], { hasHeader: true, startY: y });

// ═══════════════════════════════════════════════════════════════
// SECTION – Adresse
// ═══════════════════════════════════════════════════════════════
sectionTitle('Adresse');

const addrData = [
  ['Straße',    `${data.street || ''} ${data.houseNumber || ''}`],
  ['PLZ / Ort', `${data.zip || ''} ${data.city || ''}`],
  ['Bundesland', data.state || '–'],
  ['Land',       data.country || '–'],
];

drawTable(addrData, { startY: y });

// ═══════════════════════════════════════════════════════════════
// SECTION – Lage
// ═══════════════════════════════════════════════════════════════
sectionTitle('Lage');

const lageText = `Die Immobilie befindet sich in ${data.city}-Oberkassel, `
  + `einem der begehrtesten Wohnviertel Düsseldorfs. Die Lage bietet eine hervorragende Infrastruktur `
  + `mit zahlreichen Einkaufsmöglichkeiten, Restaurants und Cafés in unmittelbarer Nähe. `
  + `Der Rhein und die beliebte Rheinpromenade sind nur wenige Gehminuten entfernt. `
  + `Die Anbindung an den öffentlichen Nahverkehr ist ausgezeichnet.`;

doc.setFontSize(10);
doc.setTextColor(...gray);
doc.setFont('helvetica', 'normal');
const lageLines = doc.splitTextToSize(lageText, contentW);
checkPage(lageLines.length * 5 + 10);
doc.text(lageLines, margin, y);
y += lageLines.length * 5 + 4;

// ═══════════════════════════════════════════════════════════════
// FOOTER on each page
// ═══════════════════════════════════════════════════════════════
const totalPages = doc.internal.getNumberOfPages();
for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);
  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('immoSync – Immobilien-Exposé', margin, pageH - 8);
  doc.text(`Seite ${p} von ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
}

// ─── Save ────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'schanzenstrasse-10.pdf');
const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outPath, buffer);
console.log(`PDF erstellt: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
