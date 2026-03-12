export type MarketingType = 'Sale' | 'Rent';

export type HeatingType =
  | 'Central Heating'
  | 'Gas'
  | 'Electric'
  | 'Heat Pump'
  | 'District Heating'
  | 'Oil'
  | 'Pellet'
  | 'Solar';

export type ContactCategory = 'buyer' | 'tenant' | 'owner' | 'investor';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'viewing'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface SearchProfile {
  marketingType?: MarketingType;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  /** Preferred locations (city names, areas, or addresses) for matching */
  preferredLocations?: string[];
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  /** Real estate role: buyer, tenant, owner, investor */
  category?: ContactCategory;
  leadStatus?: LeadStatus;
  searchProfile?: SearchProfile;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** Manual link between a contact and a property (actively interested) */
export interface PropertyContactLink {
  id: string;
  propertyId: string;
  contactId: string;
  linkedAt: any;
  source: 'manual';
}

export interface Property {
  id: string;
  title: string;
  // Composite address (kept for backward compat)
  address: string;
  // Granular address
  street?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  state?: string;
  country?: string;
  // Classification
  marketingType?: MarketingType;
  propertyType?: string;
  // Pricing
  price: number;
  additionalCosts?: number;
  commission?: number;
  // Status
  status: 'Active' | 'Pending' | 'Sold' | 'Rented';
  /** When status is Rented: move-in date (ISO date string). */
  moveInDate?: string;
  /** When status is Rented: move-out date (ISO date string). */
  moveOutDate?: string;
  /** When status is Sold: purchase date (ISO date string). */
  purchaseDate?: string;
  /** When status is Sold: sale date (ISO date string). */
  saleDate?: string;
  type: 'Residential' | 'Commercial' | 'Land';
  // Physical dimensions
  livingSpace?: number;
  lotSize?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  bathtubs?: number;
  kitchens?: number;
  garage?: number;
  sqft: number;
  yearBuilt?: number;
  // Energy & Legal
  energyCertificate?: number;
  heatingType?: HeatingType;
  // Content
  description: string;
  /** Detailed object/condition description (step 3). Persisted separately so it saves and prefills on edit. */
  objectDescription?: string;
  /** Free-text location/area description (e.g. "Central Munich, near English Garden"). */
  locationDescription?: string;
  mainImage: string;
  images: string[];
  /** Optional video URLs (e.g. MP4/WebM uploaded to Firebase Storage). */
  videos?: string[];
  features: string[];
  createdAt: any; // Firestore Timestamp
  agentId: string;
}

/** Deal pipeline stage id (shared across sales and rental) */
export type DealStageId =
  | 'lead'
  | 'viewing'
  | 'credit_check'
  | 'negotiation'
  | 'maintenance'
  | 'notary_contract'
  | 'closed';

export type DealType = 'sale' | 'rental';

export interface Deal {
  id: string;
  contactId: string;
  propertyId: string;
  dealType: DealType;
  stageId: DealStageId;
  /** Expected commission (sale) or monthly rent (rental) */
  financialValue: number;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: 'stage_change' | 'note' | 'document_added' | 'document_removed';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: any;
  userId?: string;
}

export type DealDocumentCategory = 'lease' | 'credit_check' | 'notary' | 'other';

export interface DealDocument {
  id: string;
  dealId: string;
  name: string;
  storagePath: string;
  downloadUrl: string;
  category: DealDocumentCategory;
  uploadedAt: any;
}

/** Event type for calendar viewings/appointments */
export type ViewingEventType = 'signing' | 'viewing' | 'payment' | 'negotiation' | 'notar';

export const VIEWING_EVENT_TYPE_LABELS: Record<ViewingEventType, string> = {
  signing: 'Notar / Vertrag',
  viewing: 'Besichtigung',
  payment: 'Zahlung',
  negotiation: 'Verhandlungen',
  notar: 'Notar / Vertrag',
};

/** Scheduled event (viewing, signing, etc.) for a property with a contact */
export interface Viewing {
  id: string;
  propertyId: string;
  contactId: string;
  /** Type of event: Signing, Viewing, Payment, Negotiation, Notar */
  eventType?: ViewingEventType;
  scheduledAt: any; // Firestore Timestamp
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  note?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** In-app conversation (thread with a contact, optionally linked to a deal) */
export interface Conversation {
  id: string;
  /** Participant user ids (for now, 1:1 chat => length 2) */
  participantIds: string[];
  dealId?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** Single message in a conversation */
export interface Message {
  id: string;
  conversationId: string;
  /** User id of the sender */
  senderId: string;
  body: string;
  createdAt?: any;
  userId?: string;
}

/** Lightweight user profile for in-app messaging / presence */
export interface UserProfile {
  id: string; // Firebase auth uid
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}
