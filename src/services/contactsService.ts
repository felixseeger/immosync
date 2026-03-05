import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Contact } from '../types';

const CONTACTS_COLLECTION = 'contacts';

/**
 * Real-time subscription that streams contacts whose search profile
 * matches the given property parameters (price range + min rooms +
 * marketing type). Returns an unsubscribe function.
 */
export const subscribeToMatchingContacts = (
  property: {
    price: number;
    rooms?: number;
    bedrooms?: number;
    marketingType?: string;
  },
  callback: (contacts: Contact[]) => void
): (() => void) => {
  const q = query(collection(db, CONTACTS_COLLECTION));

  return onSnapshot(q, (snapshot) => {
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Contact));
    const rooms = property.rooms ?? property.bedrooms ?? 0;

    const matches = all.filter((c) => {
      const sp = c.searchProfile;
      if (!sp) return false;

      const priceOk =
        (sp.minPrice == null || property.price >= sp.minPrice) &&
        (sp.maxPrice == null || property.price <= sp.maxPrice);

      const roomsOk = sp.minRooms == null || rooms >= sp.minRooms;

      const mktOk =
        !sp.marketingType ||
        !property.marketingType ||
        sp.marketingType === property.marketingType;

      return priceOk && roomsOk && mktOk;
    });

    callback(matches);
  });
};

/** Seed a handful of demo contacts so the matching panel has data to show. */
export const seedDemoContacts = async (): Promise<void> => {
  const demos = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '+1 (555) 234-5678',
      company: 'TechCorp Inc.',
      searchProfile: {
        marketingType: 'Sale',
        minPrice: 500_000,
        maxPrice: 5_000_000,
        minRooms: 2,
      },
      createdAt: serverTimestamp(),
    },
    {
      name: 'Marcus Webb',
      email: 'm.webb@finance.io',
      phone: '+1 (555) 876-5432',
      company: 'Webb Capital',
      searchProfile: {
        marketingType: 'Sale',
        minPrice: 8_000_000,
        maxPrice: 20_000_000,
        minRooms: 5,
      },
      createdAt: serverTimestamp(),
    },
    {
      name: 'Elena Russo',
      email: 'erusso@design.co',
      phone: '+1 (555) 112-3344',
      company: null,
      searchProfile: {
        marketingType: 'Rent',
        minPrice: 1_000,
        maxPrice: 6_000,
        minRooms: 1,
      },
      createdAt: serverTimestamp(),
    },
    {
      name: 'James Holloway',
      email: 'jholloway@law.com',
      phone: '+1 (555) 667-8899',
      company: 'Holloway & Partners',
      searchProfile: {
        marketingType: 'Sale',
        minPrice: 1_000_000,
        maxPrice: 8_000_000,
        minRooms: 3,
      },
      createdAt: serverTimestamp(),
    },
    {
      name: 'Aisha Patel',
      email: 'aisha.p@gmail.com',
      phone: '+1 (555) 445-6677',
      company: 'MedTech Solutions',
      searchProfile: {
        marketingType: 'Sale',
        minPrice: 200_000,
        maxPrice: 600_000,
        minRooms: 2,
      },
      createdAt: serverTimestamp(),
    },
    {
      name: 'Luca Bianchi',
      email: 'luca.bianchi@realty.eu',
      phone: '+49 170 4567890',
      company: null,
      searchProfile: {
        marketingType: 'Sale',
        minPrice: 2_000_000,
        maxPrice: 15_000_000,
        minRooms: 4,
      },
      createdAt: serverTimestamp(),
    },
  ];

  for (const demo of demos) {
    await addDoc(collection(db, CONTACTS_COLLECTION), demo);
  }
};
