import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PropertyExposeView from '../components/PropertyExposeView';
import type { Property, Contact } from '../types';
import { imageUrlToBase64 } from './brochurePdf';

export interface ExposeToPdfOptions {
  filename?: string;
  locale?: string;
}

/**
 * Renders the property exposé in a hidden iframe and triggers the browser's print dialog.
 * User can select "Save as PDF" to download. Uses iframe + srcdoc to avoid popup blockers
 * and blob-URL redirect issues that occur with window.open(blobUrl).
 */
export async function exportExposeToPdf(
  property: Property,
  contacts: Contact[],
  options: ExposeToPdfOptions = {}
): Promise<void> {
  const { locale = 'de-DE' } = options;

  // 1. Resolve all images to Base64 first to avoid CORS/loading issues in iframe/print
  const mainImage = property.mainImage || (property.images?.[0]);
  const allImages = [mainImage, ...(property.images ?? []).filter(u => u !== mainImage)].filter(Boolean) as string[];

  const base64Images: Record<string, string> = {};
  await Promise.all(allImages.map(async (url) => {
    try {
      const b64 = await imageUrlToBase64(url, 1200);
      if (b64) base64Images[url] = b64;
    } catch {
      // image resolution failed — original URL will be used as fallback
    }
  }));

  // 2. Clone property but replace image URLs with Base64 versions
  const localProperty = {
    ...property,
    mainImage: property.mainImage ? (base64Images[property.mainImage] || property.mainImage) : property.mainImage,
    images: property.images?.map(url => base64Images[url] || url) ?? []
  };

  const content = renderToStaticMarkup(
    React.createElement(PropertyExposeView, {
      property: localProperty,
      contacts,
      locale,
    })
  );

  const html = `<!DOCTYPE html>
<html lang="${locale.split('-')[0]}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(property.title || 'Exposé')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; font-family: Helvetica, Arial, sans-serif; }
    @media print {
      body { margin: 0; padding: 0; }
      .expose-root { box-shadow: none !important; }
      img { max-width: 100% !important; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

  const wrapper = document.createElement('div');
  wrapper.setAttribute('style', 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'width:210mm;min-height:297mm;max-width:100%;border:none;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.3);background:#fff;');
  iframe.srcdoc = html;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.setAttribute('style', 'position:absolute;top:16px;right:16px;width:40px;height:40px;border:none;background:#333;color:#fff;font-size:24px;line-height:1;cursor:pointer;border-radius:50%;z-index:100000;');
  closeBtn.setAttribute('aria-label', 'Close');

  const cleanup = () => {
    wrapper.remove();
  };

  closeBtn.onclick = cleanup;
  wrapper.onclick = (e) => { if (e.target === wrapper) cleanup(); };

  wrapper.appendChild(iframe);
  wrapper.appendChild(closeBtn);
  document.body.appendChild(wrapper);

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) return;
    win.addEventListener('afterprint', cleanup, { once: true });
    // Small delay to ensure any internal rendering is stable
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };
}

function escapeHtml(s: string): string {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}
