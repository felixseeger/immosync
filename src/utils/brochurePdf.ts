import { jsPDF } from 'jspdf';
import { ref, getBlob, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import type { Property } from '../types';

const IMMOSYNC_LOGO_SVG = `<svg width="120" height="120" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#D9FF00"/>
  <text x="16" y="21" text-anchor="middle" font-weight="800" font-size="12" fill="black" font-family="system-ui, sans-serif">IM</text>
</svg>`;

/** Convert SVG string to PNG data URL via canvas (for use in jsPDF). */
export function getSiteSyncLogoBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([IMMOSYNC_LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 80;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load logo image'));
    };
    img.src = url;
  });
}

/** Extract Firebase Storage path from download URL, or null if not a Firebase Storage URL. */
function getStoragePathFromDownloadUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('firebasestorage.googleapis.com') && !url.includes('firebase.storage')) return null;
  const match = url.match(/\/o\/([^?]+)/);
  if (!match) return null;
  try {
    let path = decodeURIComponent(match[1]);
    if (path.startsWith('/')) path = path.slice(1);
    return path;
  } catch {
    return null;
  }
}

/** Convert a Blob to a data URL. Returns null on failure. */
function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result && result.startsWith('data:') ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/** Fetch a URL and return as data URL. Returns null on failure. */
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[PDF] fetch failed:', res.status, url.slice(0, 120));
      return null;
    }
    return blobToDataUrl(await res.blob());
  } catch (e) {
    console.warn('[PDF] fetch error:', url.slice(0, 120), e);
    return null;
  }
}

/** Load image via Firebase Storage SDK (getDownloadURL → fetch, then getBlob fallback). */
async function loadImageViaFirebaseStorage(url: string): Promise<string | null> {
  const path = getStoragePathFromDownloadUrl(url);
  if (!path) return null;

  try {
    const fileRef = ref(storage, path);

    // Strategy A: get fresh download URL (handles expired tokens)
    try {
      const freshUrl = await getDownloadURL(fileRef);
      const result = await fetchAsDataUrl(freshUrl);
      if (result) return result;
    } catch (e) {
      console.warn('[PDF] getDownloadURL failed for', path, e);
    }

    // Strategy B: getBlob via Firebase SDK
    try {
      const blob = await getBlob(fileRef);
      const result = await blobToDataUrl(blob);
      if (result) return result;
    } catch (e) {
      console.warn('[PDF] getBlob failed for', path, e);
    }
  } catch (e) {
    console.warn('[PDF] Firebase ref error:', path, e);
  }

  return null;
}

/** Downscale a data URL to JPEG via canvas. */
function downscaleToJpeg(dataUrl: string, maxWidth: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (maxWidth / w) * h;
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w));
        canvas.height = Math.max(1, Math.round(h));
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL('image/jpeg', 0.8);
        resolve(result && result.length > 6 ? result : null);
      } catch (e) {
        console.warn('[PDF] canvas error:', e);
        resolve(dataUrl); // tainted canvas – return original
      }
    };
    img.onerror = () => {
      console.warn('[PDF] Image decode failed (len=' + dataUrl.length + ')');
      resolve(null);
    };
    img.src = dataUrl;
  });
}

/** Fetch image URL and return as base64 data URL with downscaling and timeout. */
export async function imageUrlToBase64(url: string, maxWidth = 800): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;

  const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

  const fetchImage = async (): Promise<string | null> => {
    // Already a data URL
    if (url.startsWith('data:image/')) {
      return downscaleToJpeg(url, maxWidth);
    }

    let sourceDataUrl: string | null = null;

    // 1) Direct fetch (cheapest – Firebase download URLs support CORS)
    sourceDataUrl = await fetchAsDataUrl(url);

    // 2) Firebase SDK (fresh URL / getBlob)
    if (!sourceDataUrl) {
      sourceDataUrl = await loadImageViaFirebaseStorage(url);
    }

    // 3) Direct Image load fallback (works for some CORS-enabled CDNs if fetch is picky)
    if (!sourceDataUrl) {
      sourceDataUrl = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          try {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }

    if (!sourceDataUrl) {
      console.warn('[PDF] All strategies failed:', url.slice(0, 120));
      return null;
    }

    return downscaleToJpeg(sourceDataUrl, maxWidth);
  };

  return Promise.race([fetchImage(), timeout(10000)]);
}

/** Return jsPDF image format from a data URL. */
export function getFormatFromDataUrl(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

export async function generateBrochurePdf(property: Property, logoBase64: string): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let page = 1;
  const addNewPage = () => {
    doc.addPage();
    page++;
  };

  // ----- Page 1: Cover -----
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.addImage(logoBase64, 'PNG', MARGIN, MARGIN, 24, 24);

  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(property.title, MARGIN, 55, { maxWidth: CONTENT_W });

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(property.address || '', MARGIN, 62, { maxWidth: CONTENT_W });

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`€${property.price.toLocaleString()}`, MARGIN, 72);

  const mainImageUrl = property.mainImage || (property.images && property.images[0]);
  if (mainImageUrl) {
    const mainBase64 = await imageUrlToBase64(mainImageUrl);
    if (mainBase64) {
      try {
        doc.addImage(mainBase64, getFormatFromDataUrl(mainBase64), MARGIN, 82, CONTENT_W, 100);
      } catch {
        doc.setFontSize(10);
        doc.text('[Image unavailable]', MARGIN, 130);
      }
    } else {
      doc.setFontSize(10);
      doc.text('[Image unavailable]', MARGIN, 130);
    }
  }

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('SiteSync.io — Property Brochure', MARGIN, PAGE_H - 12);

  // ----- Page 2: Details -----
  addNewPage();
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Property details', MARGIN, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  const details = [
    `Price: €${property.price.toLocaleString()}`,
    `Rooms: ${property.rooms ?? '—'}  |  Baths: ${property.bathrooms ?? '—'}  |  Balconies: ${property.balconies ?? '—'}  |  Bathtubs: ${property.bathtubs ?? '—'}  |  Kitchens: ${property.kitchens ?? '—'}  |  Garage: ${property.garage ?? '—'}`,
    `Type: ${property.type ?? '—'}  |  Status: ${property.status}`,
    `Address: ${property.address || '—'}`,
  ];
  let y = 32;
  details.forEach((line) => {
    doc.text(line, MARGIN, y, { maxWidth: CONTENT_W });
    y += 8;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Description', MARGIN, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const desc = property.description || 'No description available.';
  const descLines = doc.splitTextToSize(desc, CONTENT_W);
  doc.text(descLines, MARGIN, y + 14);

  y = y + 14 + descLines.length * 5 + 10;
  if (property.features && property.features.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Features', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    property.features.forEach((f, i) => {
      doc.text(`• ${f}`, MARGIN, y + 8 + i * 6, { maxWidth: CONTENT_W });
    });
  }

  // ----- Gallery pages -----
  const images = property.images && property.images.length > 0 ? property.images : (property.mainImage ? [property.mainImage] : []);
  for (let i = 0; i < Math.min(images.length, 6); i++) {
    addNewPage();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Photo ${i + 1}`, MARGIN, 18);
    const imgBase64 = await imageUrlToBase64(images[i]);
    if (imgBase64) {
      try {
        doc.addImage(imgBase64, getFormatFromDataUrl(imgBase64), MARGIN, 22, CONTENT_W, PAGE_H - 22 - MARGIN);
      } catch {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('[Image unavailable]', MARGIN, 40);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('[Image unavailable]', MARGIN, 40);
    }
  }

  return doc;
}

export async function downloadBrochurePdf(property: Property): Promise<void> {
  const logoBase64 = await getSiteSyncLogoBase64();
  const pdf = await generateBrochurePdf(property, logoBase64);
  const safeTitle = property.title.replace(/[^a-zA-Z0-9-_ ]/g, '').slice(0, 50);
  pdf.save(`SiteSync-Brochure-${safeTitle}.pdf`);
}
