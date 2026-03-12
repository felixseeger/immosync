import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, writeBatch, } from 'firebase/firestore';
import { logActivity } from './activityService';
const CONTACTS_COLLECTION = 'contacts';
const PROPERTY_CONTACTS_COLLECTION = 'property_contacts';
/* ─── CRUD ─────────────────────────────────────────────────────────────────── */
export async function getContacts() {
    const q = query(collection(db, CONTACTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export function subscribeToContacts(callback) {
    const q = query(collection(db, CONTACTS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const contacts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(contacts);
    });
}
export async function createContact(data) {
    const ref = await addDoc(collection(db, CONTACTS_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    const detail = data.name?.trim() || data.email || 'New contact';
    await logActivity({
        type: 'lead',
        action: 'New contact',
        details: detail,
    });
    return ref.id;
}
export async function updateContact(contactId, data) {
    const ref = doc(db, CONTACTS_COLLECTION, contactId);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}
export async function deleteContact(contactId) {
    const ref = doc(db, CONTACTS_COLLECTION, contactId);
    await deleteDoc(ref);
    const linksQuery = query(collection(db, PROPERTY_CONTACTS_COLLECTION), where('contactId', '==', contactId));
    const linksSnap = await getDocs(linksQuery);
    const batch = writeBatch(db);
    linksSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}
/* ─── Property–Contact links (bidirectional) ────────────────────────────────── */
export async function getLinkedContactIdsForProperty(propertyId) {
    const q = query(collection(db, PROPERTY_CONTACTS_COLLECTION), where('propertyId', '==', propertyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data().contactId);
}
export async function getLinkedPropertyIdsForContact(contactId) {
    const q = query(collection(db, PROPERTY_CONTACTS_COLLECTION), where('contactId', '==', contactId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data().propertyId);
}
export async function linkContactToProperty(propertyId, contactId) {
    const id = `${propertyId}_${contactId}`;
    const ref = doc(db, PROPERTY_CONTACTS_COLLECTION, id);
    await setDoc(ref, {
        propertyId,
        contactId,
        linkedAt: serverTimestamp(),
        source: 'manual',
    });
    return id;
}
export async function unlinkContactFromProperty(propertyId, contactId) {
    const q = query(collection(db, PROPERTY_CONTACTS_COLLECTION), where('propertyId', '==', propertyId), where('contactId', '==', contactId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}
export function subscribeToLinkedContactIds(propertyId, callback) {
    const q = query(collection(db, PROPERTY_CONTACTS_COLLECTION), where('propertyId', '==', propertyId));
    return onSnapshot(q, (snapshot) => {
        const ids = snapshot.docs.map((d) => d.data().contactId);
        callback(ids);
    });
}
/** All links grouped by contactId -> propertyId[] (for Contacts table). */
export function subscribeToPropertyLinksByContact(callback) {
    const q = query(collection(db, PROPERTY_CONTACTS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const byContact = {};
        snapshot.docs.forEach((d) => {
            const data = d.data();
            const cid = data.contactId;
            const pid = data.propertyId;
            if (!byContact[cid])
                byContact[cid] = [];
            byContact[cid].push(pid);
        });
        callback(byContact);
    });
}
/* ─── Matching engine ──────────────────────────────────────────────────────── */
function propertyLocationStrings(property) {
    const parts = [];
    if (property.city)
        parts.push(property.city.toLowerCase().trim());
    if (property.address)
        parts.push(property.address.toLowerCase().trim());
    if (property.state)
        parts.push(property.state.toLowerCase().trim());
    if (property.country)
        parts.push(property.country.toLowerCase().trim());
    return parts;
}
function locationMatch(property, preferredLocations) {
    if (!preferredLocations?.length)
        return true;
    const propLocations = propertyLocationStrings(property);
    for (const pref of preferredLocations) {
        const p = pref.toLowerCase().trim();
        if (propLocations.some((loc) => loc.includes(p) || p.includes(loc)))
            return true;
    }
    return false;
}
/**
 * Real-time subscription: contacts that match the property (search criteria + preferred locations).
 * Does not include manually linked contacts; merge with getLinkedContactIdsForProperty in the UI.
 */
export function subscribeToMatchingContacts(property, callback) {
    const q = query(collection(db, CONTACTS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const rooms = property.rooms ?? property.bedrooms ?? 0;
        const propLocations = [];
        if (property.city)
            propLocations.push(property.city.toLowerCase());
        if (property.address)
            propLocations.push(property.address.toLowerCase());
        if (property.state)
            propLocations.push(property.state.toLowerCase());
        if (property.country)
            propLocations.push(property.country.toLowerCase());
        const matches = all.filter((c) => {
            const sp = c.searchProfile;
            if (!sp)
                return false;
            const priceOk = (sp.minPrice == null || property.price >= sp.minPrice) &&
                (sp.maxPrice == null || property.price <= sp.maxPrice);
            const roomsOk = sp.minRooms == null || rooms >= sp.minRooms;
            const mktOk = !sp.marketingType || !property.marketingType || sp.marketingType === property.marketingType;
            const locOk = locationMatch(property, sp.preferredLocations);
            return priceOk && roomsOk && mktOk && locOk;
        });
        callback(matches);
    });
}
/** Fetch contact by id (e.g. for displaying linked contacts). */
export async function getContactById(contactId) {
    const ref = doc(db, CONTACTS_COLLECTION, contactId);
    const snap = await getDoc(ref);
    if (!snap.exists())
        return null;
    return { id: snap.id, ...snap.data() };
}
/** Seed demo contacts (optional). */
export async function seedDemoContacts() {
    const demos = [
        {
            name: 'Sarah Chen',
            email: 'sarah.chen@email.com',
            phone: '+1 (555) 234-5678',
            company: 'TechCorp Inc.',
            category: 'buyer',
            leadStatus: 'qualified',
            searchProfile: {
                marketingType: 'Sale',
                minPrice: 500_000,
                maxPrice: 5_000_000,
                minRooms: 2,
                preferredLocations: ['New York', 'Brooklyn'],
            },
        },
        {
            name: 'Marcus Webb',
            email: 'm.webb@finance.io',
            phone: '+1 (555) 876-5432',
            company: 'Webb Capital',
            category: 'investor',
            leadStatus: 'viewing',
            searchProfile: {
                marketingType: 'Sale',
                minPrice: 8_000_000,
                maxPrice: 20_000_000,
                minRooms: 5,
                preferredLocations: ['Miami'],
            },
        },
        {
            name: 'Elena Russo',
            email: 'erusso@design.co',
            phone: '+1 (555) 112-3344',
            category: 'tenant',
            leadStatus: 'new',
            searchProfile: {
                marketingType: 'Rent',
                minPrice: 1_000,
                maxPrice: 6_000,
                minRooms: 1,
                preferredLocations: ['Los Angeles', 'LA'],
            },
        },
        {
            name: 'James Holloway',
            email: 'jholloway@law.com',
            phone: '+1 (555) 667-8899',
            company: 'Holloway & Partners',
            category: 'buyer',
            leadStatus: 'negotiation',
            searchProfile: {
                marketingType: 'Sale',
                minPrice: 1_000_000,
                maxPrice: 8_000_000,
                minRooms: 3,
                preferredLocations: ['Boston', 'Cambridge'],
            },
        },
        {
            name: 'Aisha Patel',
            email: 'aisha.p@gmail.com',
            phone: '+1 (555) 445-6677',
            company: 'MedTech Solutions',
            category: 'buyer',
            leadStatus: 'contacted',
            searchProfile: {
                marketingType: 'Sale',
                minPrice: 200_000,
                maxPrice: 600_000,
                minRooms: 2,
                preferredLocations: ['San Francisco', 'Oakland'],
            },
        },
        {
            name: 'Luca Bianchi',
            email: 'luca.bianchi@realty.eu',
            phone: '+49 170 4567890',
            category: 'investor',
            leadStatus: 'qualified',
            searchProfile: {
                marketingType: 'Sale',
                minPrice: 2_000_000,
                maxPrice: 15_000_000,
                minRooms: 4,
                preferredLocations: ['Munich', 'Berlin'],
            },
        },
    ];
    for (const demo of demos) {
        await addDoc(collection(db, CONTACTS_COLLECTION), {
            ...demo,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }
}
