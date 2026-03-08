import { db, storage } from '../firebase';
import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { Property } from '../types';

const PROPERTIES_COLLECTION = 'properties';

export const createProperty = async (
  data: Omit<Property, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    console.log('createProperty called with data:', {
      title: data.title,
      address: data.address,
      price: data.price,
      mainImage: data.mainImage,
      images: data.images?.length ?? 0,
      agentId: data.agentId,
      allFields: Object.keys(data).length
    });
    
    console.log('About to call addDoc to collection:', PROPERTIES_COLLECTION);
    const docRef = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log('addDoc completed, returned docRef with ID:', docRef.id);
    
    console.log('Property created successfully with ID:', docRef.id);
    
    // Verify the property was actually written
    console.log('Attempting to verify document in Firestore immediately...');
    const verifyDoc = await getDoc(docRef);
    if (verifyDoc.exists()) {
      console.log('✓ Property verified in Firestore:', verifyDoc.data());
    } else {
      console.warn('⚠ WARNING: Property created but could not be verified immediately');
    }
    
    return docRef.id;
  } catch (error) {
    console.error('❌ ERROR creating property:');
    console.error('Error type:', error?.constructor.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error object:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const updatePropertyImages = async (
  propertyId: string,
  images: string[]
): Promise<void> => {
  try {
    console.log(`updatePropertyImages called for ${propertyId} with ${images.length} images`);
    console.log('Images to save:', images);
    
    const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
    console.log('Calling updateDoc with images array and mainImage...');
    
    await updateDoc(propertyRef, {
      images,
      mainImage: images[0] ?? '',
    });
    
    console.log(`✓ updateDoc completed successfully for ${propertyId}`);
    
    // Verify the update
    console.log('Verifying update...');
    const verifyDoc = await getDoc(propertyRef);
    if (verifyDoc.exists()) {
      console.log('✓ Update verified, property now has:', {
        images: verifyDoc.data().images?.length ?? 0,
        mainImage: verifyDoc.data().mainImage,
      });
    } else {
      console.warn('⚠ Document does not exist after update attempt');
    }
  } catch (error) {
    console.error('❌ ERROR updating property images:');
    console.error('Error type:', error?.constructor.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error object:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const getProperties = async (): Promise<Property[]> => {
  try {
    console.log('getProperties called - fetching from Firestore');
    const q = query(collection(db, PROPERTIES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const properties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Property));
    
    console.log(`getProperties completed - returned ${properties.length} properties`);
    properties.forEach(p => {
      console.log(`Property: ${p.id}, mainImage: "${p.mainImage}", images count: ${p.images?.length ?? 0}`);
    });
    
    return properties;
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
};

/** Fetch titles for given property IDs (for display in Contacts table). */
export const getPropertyTitles = async (propertyIds: string[]): Promise<Record<string, string>> => {
  if (propertyIds.length === 0) return {};
  const unique = [...new Set(propertyIds)];
  const snaps = await Promise.all(unique.map((id) => getDoc(doc(db, PROPERTIES_COLLECTION, id))));
  const out: Record<string, string> = {};
  unique.forEach((id, i) => {
    const d = snaps[i];
    if (d?.exists()) out[id] = (d.data() as Property).title ?? id;
  });
  return out;
}

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

export const deletePropertyImage = async (
  propertyId: string,
  imageUrl: string
): Promise<void> => {
  try {
    // Extract file path from download URL
    // Firebase download URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded_path}?alt=media&token={token}
    const urlParts = imageUrl.split('/o/');
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL format');
    }
    
    let encodedPath = urlParts[1].split('?')[0];
    let filePath = decodeURIComponent(encodedPath);
    
    // Remove leading slash if present
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    console.log('Deleting image with path:', filePath);
    const fileRef = ref(storage, filePath);
    
    // Delete from Storage
    await deleteObject(fileRef);
    console.log('Image deleted from Storage');
    
    // Remove URL from Firestore document
    const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
    const propertyDoc = await getDoc(propertyRef);
    const currentImages = propertyDoc.data()?.images ?? [];
    const updatedImages = currentImages.filter((img: string) => img !== imageUrl);
    
    await updateDoc(propertyRef, {
      images: updatedImages,
      mainImage: updatedImages[0] ?? ''
    });
    console.log('Firestore document updated');
  } catch (error) {
    console.error('Error deleting property image:', error);
    throw error;
  }
};

export const updatePropertyVideos = async (
  propertyId: string,
  videos: string[]
): Promise<void> => {
  const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
  await updateDoc(propertyRef, { videos });
};

/** Delete a video from Storage and remove its URL from the property's videos array. */
export const deletePropertyVideo = async (
  propertyId: string,
  videoUrl: string
): Promise<void> => {
  const urlParts = videoUrl.split('/o/');
  if (urlParts.length < 2) throw new Error('Invalid video URL format');
  let filePath = decodeURIComponent(urlParts[1].split('?')[0]);
  if (filePath.startsWith('/')) filePath = filePath.slice(1);
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
  const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
  const docSnap = await getDoc(propertyRef);
  const current = (docSnap.data()?.videos ?? []) as string[];
  await updateDoc(propertyRef, { videos: current.filter((v) => v !== videoUrl) });
};

export const updateProperty = async (
  propertyId: string,
  data: Partial<Omit<Property, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
    await updateDoc(propertyRef, data as Record<string, unknown>);
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
};

export const deleteProperty = async (propertyId: string): Promise<void> => {
  try {
    const storageRef = ref(storage, `properties/${propertyId}`);
    const list = await listAll(storageRef);
    await Promise.all(list.items.map(item => deleteObject(item)));
  } catch {
    // Storage folder may not exist — continue to Firestore delete
  }
  try {
    await deleteDoc(doc(db, PROPERTIES_COLLECTION, propertyId));
  } catch (error) {
    console.error('Error deleting property document:', error);
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
      rooms: 5,
      bedrooms: 3,
      bathrooms: 3.5,
      balconies: 2,
      bathtubs: 1,
      kitchens: 1,
      garage: 1,
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
      rooms: 12,
      bedrooms: 6,
      bathrooms: 7,
      balconies: 3,
      bathtubs: 2,
      kitchens: 2,
      garage: 3,
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
      rooms: 8,
      bedrooms: 4,
      bathrooms: 4,
      balconies: 1,
      bathtubs: 1,
      kitchens: 1,
      garage: 2,
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
      rooms: 10,
      bedrooms: 5,
      bathrooms: 4.5,
      balconies: 0,
      bathtubs: 2,
      kitchens: 1,
      garage: 2,
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
