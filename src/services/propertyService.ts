import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Property } from '../types';

const PROPERTIES_COLLECTION = 'properties';

export const getProperties = async (): Promise<Property[]> => {
  try {
    const q = query(collection(db, PROPERTIES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Property));
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
};

export const addPropertyImage = async (propertyId: string, imageUrl: string): Promise<void> => {
  try {
    const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
    await updateDoc(propertyRef, {
      images: arrayUnion(imageUrl)
    });
  } catch (error) {
    console.error("Error adding image to property:", error);
    throw error;
  }
};

// Helper to seed data if empty
export const seedProperties = async () => {
  const demoProperties: Omit<Property, 'id'>[] = [
    {
      title: "Modern Downtown Penthouse",
      address: "123 Skyline Ave, New York, NY 10001",
      price: 4500000,
      status: 'Active',
      type: 'Residential',
      bedrooms: 3,
      bathrooms: 3.5,
      sqft: 2800,
      description: "Stunning penthouse with panoramic city views, floor-to-ceiling windows, and private terrace.",
      mainImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80"
      ],
      features: ["City Views", "Private Terrace", "Smart Home System", "Concierge"],
      createdAt: serverTimestamp(),
      agentId: "demo-agent-1"
    },
    {
      title: "Luxury Waterfront Villa",
      address: "456 Ocean Dr, Miami, FL 33139",
      price: 12500000,
      status: 'Active',
      type: 'Residential',
      bedrooms: 6,
      bathrooms: 7,
      sqft: 8500,
      description: "Exclusive waterfront estate with private dock, infinity pool, and lush tropical gardens.",
      mainImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
      ],
      features: ["Waterfront", "Private Dock", "Infinity Pool", "Home Theater", "Wine Cellar"],
      createdAt: serverTimestamp(),
      agentId: "demo-agent-1"
    },
    {
      title: "Contemporary Hillside Retreat",
      address: "789 Canyon Rd, Los Angeles, CA 90046",
      price: 3200000,
      status: 'Pending',
      type: 'Residential',
      bedrooms: 4,
      bathrooms: 4,
      sqft: 3200,
      description: "Architectural masterpiece nestled in the hills with open concept living and seamless indoor-outdoor flow.",
      mainImage: "https://images.unsplash.com/photo-1600596542815-3ad19fb2a258?auto=format&fit=crop&w=1600&q=80",
      images: [
        "https://images.unsplash.com/photo-1600596542815-3ad19fb2a258?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80"
      ],
      features: ["Canyon Views", "Pool", "Open Floor Plan", "Gourmet Kitchen"],
      createdAt: serverTimestamp(),
      agentId: "demo-agent-2"
    },
    {
      title: "Historic Brownstone",
      address: "321 Beacon St, Boston, MA 02116",
      price: 5800000,
      status: 'Sold',
      type: 'Residential',
      bedrooms: 5,
      bathrooms: 4.5,
      sqft: 4500,
      description: "Beautifully restored brownstone in the heart of Back Bay, featuring original details and modern updates.",
      mainImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80",
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=800&q=80"
      ],
      features: ["Historic Charm", "Roof Deck", "Elevator", "Garage Parking"],
      createdAt: serverTimestamp(),
      agentId: "demo-agent-2"
    },
    {
      title: "Commercial Office Space",
      address: "555 Tech Blvd, San Francisco, CA 94107",
      price: 8500000,
      status: 'Active',
      type: 'Commercial',
      sqft: 12000,
      description: "Prime creative office space in SoMa with exposed brick, high ceilings, and open layout.",
      mainImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80"
      ],
      features: ["Open Layout", "Conference Rooms", "Kitchenette", "Bike Storage"],
      createdAt: serverTimestamp(),
      agentId: "demo-agent-3"
    }
  ];

  try {
    const collectionRef = collection(db, PROPERTIES_COLLECTION);
    for (const property of demoProperties) {
      await addDoc(collectionRef, property);
    }
    console.log("Demo properties seeded successfully");
  } catch (error) {
    console.error("Error seeding properties:", error);
    throw error;
  }
};
