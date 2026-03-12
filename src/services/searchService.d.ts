import type { Property, Contact, Deal, Viewing } from '@immosync/core';
export type SearchResultItem = {
    type: 'contact';
    id: string;
    contact: Contact;
    matchLabel: string;
} | {
    type: 'property';
    id: string;
    property: Property;
    matchLabel: string;
} | {
    type: 'deal';
    id: string;
    deal: Deal;
    matchLabel: string;
} | {
    type: 'calendar';
    id: string;
    viewing: Viewing;
    matchLabel: string;
};
export interface SearchResultsByCategory {
    contacts: SearchResultItem[];
    properties: SearchResultItem[];
    deals: SearchResultItem[];
    calendar: SearchResultItem[];
}
export declare function searchFirestoreGrouped(query: string): Promise<SearchResultsByCategory>;
