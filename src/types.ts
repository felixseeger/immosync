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

export interface SearchProfile {
  marketingType?: MarketingType;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  searchProfile?: SearchProfile;
  createdAt?: any;
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
  status: 'Active' | 'Pending' | 'Sold';
  type: 'Residential' | 'Commercial' | 'Land';
  // Physical dimensions
  livingSpace?: number;
  lotSize?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft: number;
  yearBuilt?: number;
  // Energy & Legal
  energyCertificate?: number;
  heatingType?: HeatingType;
  // Content
  description: string;
  mainImage: string;
  images: string[];
  features: string[];
  createdAt: any; // Firestore Timestamp
  agentId: string;
}
