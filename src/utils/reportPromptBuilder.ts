// ---------------------------------------------------------------------------
// ReportSnapshot — the data shape passed in from the Dashboard
// ---------------------------------------------------------------------------
export interface ReportSnapshot {
  exportedAt: string;           // ISO date string
  activeListings: number;
  contactsCount: number;
  portfolioValue: number;       // raw number in EUR
  totalProperties: number;
  activeDealsCount: number;
  newLeadsCount: number;
  todayViewingsCount: number;
  byStatus: {
    Active: number;
    Pending: number;
    Sold: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatEur(value: number): string {
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(0)}K`;
  }
  return `€${value.toLocaleString('en-US')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds a richly structured Imagen 3 prompt for a branded ImmoSync
 * dashboard report infographic card.
 *
 * Kept under ~900 chars — Imagen 3 sweet spot for layout prompts.
 */
export function buildReportImagePrompt(report: ReportSnapshot): string {
  const {
    exportedAt,
    activeListings,
    contactsCount,
    portfolioValue,
    activeDealsCount,
  } = report;

  const portfolioStr  = formatEur(portfolioValue);
  const dateStr       = formatDate(exportedAt);

  const prompt = [
    `A premium, high-contrast minimalist real estate report card for "ImmoSync".`,
    `Background: Deep matte charcoal (#0B1622). Accents: Vivid neon-lime (#D9FF00).`,
    `Header: The ImmoSync Brand Logo (a stylized chartreuse geometric house icon) is large and centered at the top, accompanied by the text "ImmoSync" in bold white typography. Below the logo, the date "${dateStr}" in small muted gray text.`,
    `Layout: A single, perfectly aligned horizontal row of 4 Key Metrics. Each metric consists of a large white numeral above a small neon-lime (#D9FF00) label:`,
    `1. "${portfolioStr}" labeled "PORTFOLIO VALUE"`,
    `2. "${activeListings}" labeled "ACTIVE LISTINGS"`,
    `3. "${contactsCount}" labeled "TOTAL CONTACTS"`,
    `4. "${activeDealsCount}" labeled "ACTIVE DEALS"`,
    `Aesthetic: Ultra-clean, professional Swiss typography style. No icons inside the metrics, just pure numbers and text.`,
    `Footer: A single thin neon-lime line at the very bottom. No background photography. Pure, high-end graphic design.`,
  ].join(' ');

  return prompt;
}
