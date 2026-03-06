import { getProperties } from './propertyService';
import { getContacts } from './contactsService';
import { getDeals } from './dealsService';
import { getViewings } from './viewingsService';
import type { Property } from '../types';
import type { Contact } from '../types';
import type { Deal } from '../types';
import type { Viewing } from '../types';
import { format } from 'date-fns';

export type SearchResultItem =
  | { type: 'contact'; id: string; contact: Contact; matchLabel: string }
  | { type: 'property'; id: string; property: Property; matchLabel: string }
  | { type: 'deal'; id: string; deal: Deal; matchLabel: string }
  | { type: 'calendar'; id: string; viewing: Viewing; matchLabel: string };

export interface SearchResultsByCategory {
  contacts: SearchResultItem[];
  properties: SearchResultItem[];
  deals: SearchResultItem[];
  calendar: SearchResultItem[];
}

function normalize(s: string): string {
  return (s ?? '').toLowerCase().trim();
}

function matchesQuery(text: string, q: string): boolean {
  if (!q) return true;
  return normalize(text).includes(normalize(q));
}

const LIMIT_PER_CATEGORY = 6;

export async function searchFirestoreGrouped(query: string): Promise<SearchResultsByCategory> {
  const q = query.trim();
  if (!q || q.length < 2) {
    return { contacts: [], properties: [], deals: [], calendar: [] };
  }

  const [properties, contacts, deals, viewings] = await Promise.all([
    getProperties(),
    getContacts(),
    getDeals(),
    getViewings(),
  ]);

  const contactMap = new Map(contacts.map((c) => [c.id, c]));
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const results: SearchResultsByCategory = {
    contacts: [],
    properties: [],
    deals: [],
    calendar: [],
  };

  for (const p of properties) {
    if (results.properties.length >= LIMIT_PER_CATEGORY) break;
    const matchTitle = matchesQuery(p.title, q);
    const matchAddress = matchesQuery(p.address ?? '', q);
    const matchStreet = p.street && matchesQuery(p.street, q);
    const matchCity = p.city && matchesQuery(p.city, q);
    const matchDesc = p.description && matchesQuery(p.description, q);
    const matchBathrooms = p.bathrooms != null && (normalize(String(p.bathrooms)).includes(normalize(q)) || normalize(q).includes(normalize(String(p.bathrooms))));
    const matchBedrooms = p.bedrooms != null && (normalize(String(p.bedrooms)).includes(normalize(q)) || normalize(q).includes(normalize(String(p.bedrooms))));
    const matchSqft = p.sqft != null && (normalize(String(p.sqft)).includes(normalize(q)) || normalize(q).includes(normalize(String(p.sqft))));
    const matchZip = p.zip && matchesQuery(p.zip, q);
    if (matchTitle || matchAddress || matchStreet || matchCity || matchDesc || matchBathrooms || matchBedrooms || matchSqft || matchZip) {
      results.properties.push({
        type: 'property',
        id: p.id,
        property: p,
        matchLabel: [p.title, p.address].filter(Boolean).join(' · ') || p.id,
      });
    }
  }

  for (const c of contacts) {
    if (results.contacts.length >= LIMIT_PER_CATEGORY) break;
    const matchName = matchesQuery(c.name, q);
    const matchEmail = c.email && matchesQuery(c.email, q);
    const matchPhone = c.phone && matchesQuery(c.phone, q);
    const matchCompany = c.company && matchesQuery(c.company, q);
    if (matchName || matchEmail || matchPhone || matchCompany) {
      results.contacts.push({
        type: 'contact',
        id: c.id,
        contact: c,
        matchLabel: [c.name, c.email].filter(Boolean).join(' · ') || c.id,
      });
    }
  }

  for (const d of deals) {
    if (results.deals.length >= LIMIT_PER_CATEGORY) break;
    const contactName = contactMap.get(d.contactId)?.name ?? '';
    const propertyTitle = propertyMap.get(d.propertyId)?.title ?? '';
    const valueStr = String(d.financialValue ?? '');
    const typeLabel = d.dealType === 'sale' ? 'Sale' : 'Rental';
    if (
      matchesQuery(contactName, q) ||
      matchesQuery(propertyTitle, q) ||
      matchesQuery(valueStr, q) ||
      matchesQuery(typeLabel, q)
    ) {
      results.deals.push({
        type: 'deal',
        id: d.id,
        deal: d,
        matchLabel: [contactName, propertyTitle].filter(Boolean).join(' · ') || valueStr || d.id,
      });
    }
  }

  for (const v of viewings) {
    if (results.calendar.length >= LIMIT_PER_CATEGORY) break;
    const contactName = contactMap.get(v.contactId)?.name ?? '';
    const propertyTitle = propertyMap.get(v.propertyId)?.title ?? '';
    const dateStr =
      v.scheduledAt?.toDate?.() ? format(v.scheduledAt.toDate(), 'PPp') : '';
    if (
      matchesQuery(contactName, q) ||
      matchesQuery(propertyTitle, q) ||
      matchesQuery(dateStr, q) ||
      matchesQuery(v.note ?? '', q)
    ) {
      results.calendar.push({
        type: 'calendar',
        id: v.id,
        viewing: v,
        matchLabel: [propertyTitle, contactName, dateStr].filter(Boolean).join(' · ') || v.id,
      });
    }
  }

  return results;
}
