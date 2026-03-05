import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_API_KEY",
  authDomain: "sitesync-c3f9a.firebaseapp.com",
  projectId: "sitesync-c3f9a",
  storageBucket: "sitesync-c3f9a.firebasestorage.app",
  messagingSenderId: "30282954627",
  appId: "1:30282954627:web:50a2c7704a1449a70ea8b6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
