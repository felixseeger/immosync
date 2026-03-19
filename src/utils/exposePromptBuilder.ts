import type { Property } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(value: number): string {
  return `€${value.toLocaleString('de-DE')}`;
}

function statLine(label: string, value: unknown): string {
  if (value == null || value === '') return '';
  return `  "${label}": ${JSON.stringify(value)}`;
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build a Gemini prompt that takes property data as structured JSON input
 * and asks for a JSON layout descriptor for a multi-page A4 PDF exposé.
 *
 * The response JSON follows the ExposeLayout schema consumed by
 * exposeLayoutRenderer.ts.
 */
export function buildExposePrompt(property: Property): string {
  // -- Compile property summary as JSON for Gemini --------------------------
  // Match the logic in exposeLayoutRenderer.ts for consistent indexing
  const allUrls: string[] = [];
  if (property.mainImage) allUrls.push(property.mainImage);
  if (property.images) {
    for (const url of property.images) {
      if (url !== property.mainImage) allUrls.push(url);
    }
  }
  const totalImages = allUrls.length;

  const propertyJson: Record<string, unknown> = {
    title: property.title,
    address: property.address,
    city: property.city ?? '',
    price: formatEur(property.price),
    priceRaw: property.price,
    marketingType: property.marketingType ?? 'Sale',
    propertyType: property.propertyType ?? property.type,
    status: property.status,
    rooms: property.rooms,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    balconies: property.balconies,
    kitchens: property.kitchens,
    garage: property.garage,
    livingSpace: property.livingSpace ? `${property.livingSpace} m²` : null,
    lotSize: property.lotSize ? `${property.lotSize} m²` : null,
    yearBuilt: property.yearBuilt,
    energyCertificate: property.energyCertificate,
    heatingType: property.heatingType,
    description: property.description?.slice(0, 500) || null,
    objectDescription: property.objectDescription?.slice(0, 500) || null,
    locationDescription: property.locationDescription?.slice(0, 300) || null,
    features: property.features?.slice(0, 20) || [],
    totalImages,
  };

  // Remove null/undefined entries for a cleaner prompt
  const cleanJson = Object.fromEntries(
    Object.entries(propertyJson).filter(([, v]) => v != null && v !== ''),
  );

  // -- Build the full prompt ------------------------------------------------
  const prompt = `You are a professional real estate exposé designer. Given the following property data as JSON, generate a creative multi-page A4 layout descriptor as JSON.

## Property Data (JSON input):
\`\`\`json
${JSON.stringify(cleanJson, null, 2)}
\`\`\`

## Your Task:
Design a visually appealing, modern A4 (210×297mm) property exposé layout. Return ONLY valid JSON matching the schema below. Be creative with the page layouts and color choices — tailor the design to the property type and price segment.

## JSON Output Schema:
\`\`\`
{
  "pages": [
    {
      "type": "cover",
      "heroImageIndex": 0,
      "imageFit": "fullbleed" | "half-top" | "half-left",
      "showPrice": true/false,
      "showAddress": true/false,
      "overlayOpacity": 0.0-1.0
    },
    {
      "type": "details",
      "layout": "modern-cards" | "classic-lines" | "two-column",
      "sections": ["stats", "description", "objectDescription", "locationDescription", "energy"]
    },
    {
      "type": "gallery",
      "layout": "grid-2x2" | "grid-1x2" | "single-full" | "grid-3",
      "imageIndices": [1, 2, 3, 4]
    },
    {
      "type": "features",
      "layout": "checkmark-grid" | "pill-tags" | "two-column-list"
    }
  ],
  "pageOrder": ["cover", "details", "gallery", "features"],
  "colorScheme": {
    "primary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex",
    "muted": "#hex"
  },
  "typography": {
    "headingStyle": "uppercase" | "capitalize" | "normal",
    "bodySize": "small" | "medium" | "large"
  }
}
\`\`\`

## Rules:
1. Always include a "cover" page as the first page.
2. Include a "details" page with property stats and description.
3. If totalImages > 1, include one or more "gallery" pages. Distribute images logically across pages. imageIndices are 0-based into the property images array. Index 0 = main image.
4. If the property has features, include a "features" page.
5. Choose colors that match the property's character: luxury properties → dark/gold, modern apartments → clean/minimal, family homes → warm/inviting.
6. Keep accent color vibrant. The ImmoSync brand color is #D9FF00 (chartreuse) — you may use it as accent or choose a complementary one.
7. Maximum 8 pages total. Gallery imageIndices must not exceed ${totalImages - 1}.
8. All page types must be in pageOrder array.
9. Return ONLY the JSON object, nothing else.`;

  return prompt;
}
