import { jsPDF } from 'jspdf';
import type { Property } from '../types';
import { imageUrlToBase64, getSiteSyncLogoBase64 } from './brochurePdf';

// ---------------------------------------------------------------------------
// Types – consumed by geminiLayoutService.ts
// ---------------------------------------------------------------------------

export interface ExposeLayout {
  pages: ExposePage[];
  pageOrder: string[];
  colorScheme: {
    primary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    headingStyle: 'uppercase' | 'capitalize' | 'normal';
    bodySize: 'small' | 'medium' | 'large';
  };
}

export type ExposePage = CoverPage | DetailPage | GalleryPage | FeaturesPage;

export interface CoverPage {
  type: 'cover';
  heroImageIndex: number;
  imageFit: 'fullbleed' | 'half-top' | 'half-left';
  showPrice: boolean;
  showAddress: boolean;
  overlayOpacity: number;
}

export interface DetailPage {
  type: 'details';
  layout: 'modern-cards' | 'classic-lines' | 'two-column';
  sections: string[];
}

export interface GalleryPage {
  type: 'gallery';
  layout: 'grid-2x2' | 'grid-1x2' | 'single-full' | 'grid-3';
  imageIndices: number[];
}

export interface FeaturesPage {
  type: 'features';
  layout: 'checkmark-grid' | 'pill-tags' | 'two-column-list';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const W = 210;
const H = 297;
const M = 18; // margin
const CW = W - M * 2; // content width

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function setFill(doc: jsPDF, hex: string, opacity = 1) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
  if (opacity < 1) doc.setGState(doc.GState({ opacity }));
}

function setTextCol(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

function setDrawCol(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

// ---------------------------------------------------------------------------
// Image format helper
// ---------------------------------------------------------------------------

function imgFmt(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

function bodySizePt(size: string): number {
  return size === 'large' ? 11 : size === 'small' ? 9 : 10;
}

function applyHeading(text: string, style: string): string {
  if (style === 'uppercase') return text.toUpperCase();
  if (style === 'capitalize')
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
  return text;
}

// ---------------------------------------------------------------------------
// Load all images upfront
// ---------------------------------------------------------------------------

async function loadImages(property: Property): Promise<(string | null)[]> {
  const allUrls: string[] = [];
  
  // 1. Primary image first
  if (property.mainImage) {
    allUrls.push(property.mainImage);
  }

  // 2. Add other unique images
  if (property.images) {
    for (const url of property.images) {
      if (!allUrls.includes(url)) {
        allUrls.push(url);
      }
    }
  }

  // If no images at all, we'll return an empty array
  if (allUrls.length === 0) return [];
  
  // Use higher maxWidth for Expose (1200px) vs Report (800px)
  const imagePromises = allUrls.map(async (url) => {
    try {
      return await imageUrlToBase64(url, 1200);
    } catch (err) {
      console.warn('Failed to load image for expose:', url, err);
      return null;
    }
  });
  
  return Promise.all(imagePromises);
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

function renderCover(
  doc: jsPDF,
  page: CoverPage,
  property: Property,
  images: (string | null)[],
  logoBase64: string,
  cs: ExposeLayout['colorScheme'],
  typo: ExposeLayout['typography'],
) {
  const img = images[page.heroImageIndex ?? 0];

  if (page.imageFit === 'fullbleed') {
    // Full bleed image
    if (img) {
      try { doc.addImage(img, imgFmt(img), 0, 0, W, H); } catch { /* skip */ }
    } else {
      setFill(doc, cs.primary);
      doc.rect(0, 0, W, H, 'F');
    }
    // Dark overlay at bottom
    const oy = H * 0.55;
    setFill(doc, '#000000', page.overlayOpacity ?? 0.55);
    doc.rect(0, oy, W, H - oy, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    // Logo
    try { doc.addImage(logoBase64, 'PNG', M, M, 18, 18); } catch { /* skip */ }

    // Title
    let y = oy + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    setTextCol(doc, '#FFFFFF');
    const titleText = applyHeading(property.title, typo.headingStyle);
    const titleLines = doc.splitTextToSize(titleText, CW);
    doc.text(titleLines, M, y);
    y += titleLines.length * 10 + 4;

    if (page.showAddress && property.address) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(property.address, M, y);
      y += 8;
    }
    if (page.showPrice) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      setTextCol(doc, cs.accent);
      doc.text(`€${property.price.toLocaleString('de-DE')}`, M, y + 4);
    }
  } else if (page.imageFit === 'half-top') {
    // Image top half
    if (img) {
      try { doc.addImage(img, imgFmt(img), 0, 0, W, H / 2); } catch { /* skip */ }
    } else {
      setFill(doc, cs.primary);
      doc.rect(0, 0, W, H / 2, 'F');
    }
    // Bottom half
    setFill(doc, cs.background);
    doc.rect(0, H / 2, W, H / 2, 'F');

    let y = H / 2 + 20;
    try { doc.addImage(logoBase64, 'PNG', M, y - 14, 14, 14); } catch { /* skip */ }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    setTextCol(doc, cs.text);
    const titleText = applyHeading(property.title, typo.headingStyle);
    const titleLines = doc.splitTextToSize(titleText, CW);
    doc.text(titleLines, M, y + 8);
    y += 8 + titleLines.length * 9 + 4;

    if (page.showAddress && property.address) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      setTextCol(doc, cs.muted);
      doc.text(property.address, M, y);
      y += 8;
    }
    if (page.showPrice) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      setTextCol(doc, cs.accent);
      doc.text(`€${property.price.toLocaleString('de-DE')}`, M, y + 2);
    }
  } else {
    // half-left
    const halfW = W / 2;
    if (img) {
      try { doc.addImage(img, imgFmt(img), 0, 0, halfW, H); } catch { /* skip */ }
    } else {
      setFill(doc, cs.primary);
      doc.rect(0, 0, halfW, H, 'F');
    }
    setFill(doc, cs.background);
    doc.rect(halfW, 0, halfW, H, 'F');

    const rx = halfW + 12;
    const rw = halfW - 24;
    let y = 40;
    try { doc.addImage(logoBase64, 'PNG', rx, M, 14, 14); } catch { /* skip */ }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    setTextCol(doc, cs.text);
    const titleText = applyHeading(property.title, typo.headingStyle);
    const titleLines = doc.splitTextToSize(titleText, rw);
    doc.text(titleLines, rx, y);
    y += titleLines.length * 8 + 6;

    if (page.showAddress && property.address) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setTextCol(doc, cs.muted);
      const aLines = doc.splitTextToSize(property.address, rw);
      doc.text(aLines, rx, y);
      y += aLines.length * 5 + 6;
    }
    if (page.showPrice) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      setTextCol(doc, cs.accent);
      doc.text(`€${property.price.toLocaleString('de-DE')}`, rx, y);
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setTextCol(doc, cs.muted);
  doc.text('SiteSync.io — Property Exposé', M, H - 8);
}

// ---------------------------------------------------------------------------

function renderDetails(
  doc: jsPDF,
  page: DetailPage,
  property: Property,
  cs: ExposeLayout['colorScheme'],
  typo: ExposeLayout['typography'],
) {
  setFill(doc, cs.background);
  doc.rect(0, 0, W, H, 'F');

  const bSize = bodySizePt(typo.bodySize);
  let y = M + 4;

  // Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setTextCol(doc, cs.text);
  doc.text(applyHeading('Objektdaten', typo.headingStyle), M, y);
  y += 12;

  const stats: [string, string][] = [
    ['Preis', `€${property.price.toLocaleString('de-DE')}`],
    ['Zimmer', String(property.rooms ?? '—')],
    ['Schlafzimmer', String(property.bedrooms ?? '—')],
    ['Badezimmer', String(property.bathrooms ?? '—')],
    ['Wohnfläche', property.livingSpace ? `${property.livingSpace} m²` : '—'],
    ['Grundstück', property.lotSize ? `${property.lotSize} m²` : '—'],
    ['Baujahr', String(property.yearBuilt ?? '—')],
    ['Heizung', property.heatingType ?? '—'],
    ['Energieausweis', String(property.energyCertificate ?? '—')],
    ['Typ', String(property.propertyType ?? property.type ?? '—')],
  ];

  if (page.layout === 'modern-cards') {
    const cols = 2;
    const gap = 6;
    const cardW = (CW - gap) / cols;
    const cardH = 18;
    stats.forEach(([label, val], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = M + col * (cardW + gap);
      const cy = y + row * (cardH + gap);
      if (cy + cardH > H - M) return; // prevent overflow
      setFill(doc, cs.primary, 0.1);
      doc.rect(cx, cy, cardW, cardH, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setTextCol(doc, cs.muted);
      doc.text(label, cx + 4, cy + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(bSize + 1);
      setTextCol(doc, cs.text);
      doc.text(val, cx + 4, cy + 14);
    });
    y += Math.ceil(stats.length / cols) * (cardH + gap) + 6;
  } else if (page.layout === 'two-column') {
    const colW = CW / 2 - 4;
    stats.forEach(([label, val], i) => {
      const cx = i % 2 === 0 ? M : M + colW + 8;
      const ry = y + Math.floor(i / 2) * 10;
      if (ry > H - M) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bSize);
      setTextCol(doc, cs.muted);
      doc.text(label + ':', cx, ry);
      doc.setFont('helvetica', 'bold');
      setTextCol(doc, cs.text);
      doc.text(val, cx + 40, ry);
    });
    y += Math.ceil(stats.length / 2) * 10 + 8;
  } else {
    // classic-lines
    stats.forEach(([label, val]) => {
      if (y > H - M - 10) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bSize);
      setTextCol(doc, cs.muted);
      doc.text(label, M, y);
      doc.setFont('helvetica', 'bold');
      setTextCol(doc, cs.text);
      doc.text(val, M + 55, y);
      setDrawCol(doc, cs.muted);
      doc.setLineWidth(0.2);
      doc.line(M, y + 2, M + CW, y + 2);
      y += 9;
    });
    y += 4;
  }

  // Sections: description, objectDescription, locationDescription, energy
  for (const section of page.sections) {
    if (y > H - M - 20) break;

    if (section === 'description' && property.description) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      setTextCol(doc, cs.text);
      doc.text(applyHeading('Beschreibung', typo.headingStyle), M, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bSize);
      setTextCol(doc, cs.text);
      const lines = doc.splitTextToSize(property.description, CW);
      const maxLines = Math.floor((H - M - y) / 4.5);
      doc.text(lines.slice(0, maxLines), M, y);
      y += Math.min(lines.length, maxLines) * 4.5 + 8;
    }

    if (section === 'objectDescription' && property.objectDescription) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      setTextCol(doc, cs.text);
      doc.text(applyHeading('Objektbeschreibung', typo.headingStyle), M, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bSize);
      setTextCol(doc, cs.text);
      const lines = doc.splitTextToSize(property.objectDescription, CW);
      const maxLines = Math.floor((H - M - y) / 4.5);
      doc.text(lines.slice(0, maxLines), M, y);
      y += Math.min(lines.length, maxLines) * 4.5 + 8;
    }

    if (section === 'locationDescription' && property.locationDescription) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      setTextCol(doc, cs.text);
      doc.text(applyHeading('Lage', typo.headingStyle), M, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bSize);
      setTextCol(doc, cs.text);
      const lines = doc.splitTextToSize(property.locationDescription, CW);
      const maxLines = Math.floor((H - M - y) / 4.5);
      doc.text(lines.slice(0, maxLines), M, y);
      y += Math.min(lines.length, maxLines) * 4.5 + 8;
    }

    if (section === 'energy') {
      if (property.energyCertificate || property.heatingType) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        setTextCol(doc, cs.text);
        doc.text(applyHeading('Energie', typo.headingStyle), M, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(bSize);
        setTextCol(doc, cs.text);
        if (property.energyCertificate) {
          doc.text(`Energieausweis: ${property.energyCertificate}`, M, y);
          y += 5;
        }
        if (property.heatingType) {
          doc.text(`Heizung: ${property.heatingType}`, M, y);
          y += 5;
        }
        y += 6;
      }
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setTextCol(doc, cs.muted);
  doc.text('SiteSync.io — Property Exposé', M, H - 8);
}

// ---------------------------------------------------------------------------

function renderGallery(
  doc: jsPDF,
  page: GalleryPage,
  images: (string | null)[],
  cs: ExposeLayout['colorScheme'],
) {
  setFill(doc, cs.background);
  doc.rect(0, 0, W, H, 'F');

  const gap = 4;
  const indices = (page.imageIndices ?? []).filter((i) => i < images.length);

  function place(img: string | null, x: number, y: number, w: number, h: number) {
    if (!img) return;
    try { doc.addImage(img, imgFmt(img), x, y, w, h); } catch { /* skip */ }
  }

  if (page.layout === 'grid-2x2') {
    const cellW = (CW - gap) / 2;
    const cellH = (H - M * 2 - gap) / 2;
    indices.slice(0, 4).forEach((idx, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      place(images[idx], M + col * (cellW + gap), M + row * (cellH + gap), cellW, cellH);
    });
  } else if (page.layout === 'grid-1x2') {
    const cellH = (H - M * 2 - gap) / 2;
    indices.slice(0, 2).forEach((idx, i) => {
      place(images[idx], M, M + i * (cellH + gap), CW, cellH);
    });
  } else if (page.layout === 'single-full') {
    if (indices[0] != null) place(images[indices[0]], 0, 0, W, H);
  } else if (page.layout === 'grid-3') {
    // 1 large on top, 2 smaller on bottom
    const topH = (H - M * 2 - gap) * 0.6;
    const botH = (H - M * 2 - gap) * 0.4;
    const halfW = (CW - gap) / 2;
    if (indices[0] != null) place(images[indices[0]], M, M, CW, topH);
    if (indices[1] != null) place(images[indices[1]], M, M + topH + gap, halfW, botH);
    if (indices[2] != null) place(images[indices[2]], M + halfW + gap, M + topH + gap, halfW, botH);
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setTextCol(doc, cs.muted);
  doc.text('SiteSync.io — Property Exposé', M, H - 8);
}

// ---------------------------------------------------------------------------

function renderFeatures(
  doc: jsPDF,
  page: FeaturesPage,
  property: Property,
  cs: ExposeLayout['colorScheme'],
  typo: ExposeLayout['typography'],
) {
  setFill(doc, cs.background);
  doc.rect(0, 0, W, H, 'F');

  const features = property.features ?? [];
  if (features.length === 0) return;

  let y = M + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setTextCol(doc, cs.text);
  doc.text(applyHeading('Ausstattung', typo.headingStyle), M, y);
  y += 14;

  const bSize = bodySizePt(typo.bodySize);

  if (page.layout === 'checkmark-grid') {
    const cols = 2;
    const colW = CW / cols;
    features.forEach((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const fy = y + row * 9;
      if (fy > H - M) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bSize);
      setTextCol(doc, cs.accent);
      doc.text('✓', M + col * colW, fy);
      setTextCol(doc, cs.text);
      doc.text(f, M + col * colW + 7, fy);
    });
  } else if (page.layout === 'pill-tags') {
    let cx = M;
    let cy = y;
    features.forEach((f) => {
      doc.setFontSize(bSize);
      const tw = doc.getTextWidth(f) + 10;
      if (cx + tw > M + CW) {
        cx = M;
        cy += 12;
      }
      if (cy > H - M) return;
      setFill(doc, cs.primary, 0.15);
      doc.roundedRect(cx, cy - 5, tw, 9, 4, 4, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setFont('helvetica', 'normal');
      setTextCol(doc, cs.text);
      doc.text(f, cx + 5, cy + 1);
      cx += tw + 4;
    });
  } else {
    // two-column-list
    const colW = CW / 2;
    const half = Math.ceil(features.length / 2);
    features.forEach((f, i) => {
      const col = i < half ? 0 : 1;
      const row = i < half ? i : i - half;
      const fy = y + row * 8;
      if (fy > H - M) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bSize);
      setTextCol(doc, cs.muted);
      doc.text('•', M + col * colW, fy);
      setTextCol(doc, cs.text);
      doc.text(f, M + col * colW + 5, fy);
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setTextCol(doc, cs.muted);
  doc.text('SiteSync.io — Property Exposé', M, H - 8);
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

export async function renderExposeLayout(
  layout: ExposeLayout,
  property: Property,
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const images = await loadImages(property);
  const loaded = images.filter(Boolean).length;
  console.log(`[PDF Exposé] Images loaded: ${loaded}/${images.length}`);
  if (loaded === 0 && images.length > 0) {
    console.warn('[PDF Exposé] No images could be loaded – PDF will have no photos.');
  }
  const logoBase64 = await getSiteSyncLogoBase64();

  const cs = layout.colorScheme ?? {
    primary: '#D9FF00',
    accent: '#D9FF00',
    background: '#FFFFFF',
    text: '#111111',
    muted: '#777777',
  };
  const typo = layout.typography ?? {
    headingStyle: 'normal' as const,
    bodySize: 'medium' as const,
  };

  // Determine page order from layout
  const orderedPages: ExposePage[] = [];
  if (layout.pageOrder?.length) {
    for (const typeName of layout.pageOrder) {
      const found = layout.pages.find((p) => p.type === typeName);
      if (found) orderedPages.push(found);
    }
  }
  // Add any pages not in pageOrder (fallback)
  for (const p of layout.pages) {
    if (!orderedPages.includes(p)) orderedPages.push(p);
  }

  for (let i = 0; i < orderedPages.length; i++) {
    if (i > 0) doc.addPage();
    const p = orderedPages[i];

    switch (p.type) {
      case 'cover':
        renderCover(doc, p, property, images, logoBase64, cs, typo);
        break;
      case 'details':
        renderDetails(doc, p, property, cs, typo);
        break;
      case 'gallery':
        renderGallery(doc, p, images, cs);
        break;
      case 'features':
        renderFeatures(doc, p, property, cs, typo);
        break;
    }
  }

  return doc;
}
