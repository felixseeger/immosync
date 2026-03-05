export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  status: 'Active' | 'Pending' | 'Sold';
  type: 'Residential' | 'Commercial' | 'Land';
  bedrooms?: number;
  bathrooms?: number;
  sqft: number;
  description: string;
  mainImage: string;
  images: string[];
  features: string[];
  createdAt: any; // Firestore Timestamp
  agentId: string;
}
