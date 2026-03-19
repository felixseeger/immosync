const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Init Firebase Admin
const serviceAccount = require('../sitesync-c3f9a-firebase-adminsdk-fbsvc-3811ae7f72.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

async function main() {
  const search = 'Schanzenstr';
  console.log(`Searching for property matching "${search}"...`);

  const snapshot = await db.collection('properties').get();
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Find by address or street containing the search term
  const match = all.find(p =>
    (p.address && p.address.toLowerCase().includes(search.toLowerCase())) ||
    (p.street && p.street.toLowerCase().includes(search.toLowerCase())) ||
    (p.title && p.title.toLowerCase().includes(search.toLowerCase()))
  );

  if (!match) {
    console.error('No property found. Listing all addresses:');
    all.forEach(p => console.log(`  - [${p.id}] ${p.address || p.street || p.title}`));
    process.exit(1);
  }

  console.log(`Found: ${match.title} (${match.id})`);

  // Write JSON
  const outPath = path.join(__dirname, 'property-data.json');
  fs.writeFileSync(outPath, JSON.stringify(match, null, 2), 'utf-8');
  console.log(`Property data saved to ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
