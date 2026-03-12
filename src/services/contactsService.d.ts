import type { Contact } from '../types';
export declare function getContacts(): Promise<Contact[]>;
export declare function subscribeToContacts(callback: (contacts: Contact[]) => void): () => void;
export type ContactCreateInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt?: never;
    updatedAt?: never;
};
export declare function createContact(data: ContactCreateInput): Promise<string>;
export declare function updateContact(contactId: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>> & {
    updatedAt?: any;
}): Promise<void>;
export declare function deleteContact(contactId: string): Promise<void>;
export declare function getLinkedContactIdsForProperty(propertyId: string): Promise<string[]>;
export declare function getLinkedPropertyIdsForContact(contactId: string): Promise<string[]>;
export declare function linkContactToProperty(propertyId: string, contactId: string): Promise<string>;
export declare function unlinkContactFromProperty(propertyId: string, contactId: string): Promise<void>;
export declare function subscribeToLinkedContactIds(propertyId: string, callback: (contactIds: string[]) => void): () => void;
/** All links grouped by contactId -> propertyId[] (for Contacts table). */
export declare function subscribeToPropertyLinksByContact(callback: (byContact: Record<string, string[]>) => void): () => void;
/**
 * Real-time subscription: contacts that match the property (search criteria + preferred locations).
 * Does not include manually linked contacts; merge with getLinkedContactIdsForProperty in the UI.
 */
export declare function subscribeToMatchingContacts(property: {
    price: number;
    rooms?: number;
    bedrooms?: number;
    marketingType?: string;
    city?: string;
    address?: string;
    state?: string;
    country?: string;
}, callback: (contacts: Contact[]) => void): () => void;
/** Fetch contact by id (e.g. for displaying linked contacts). */
export declare function getContactById(contactId: string): Promise<Contact | null>;
/** Seed demo contacts (optional). */
export declare function seedDemoContacts(): Promise<void>;
