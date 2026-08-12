import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Client-side Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForHospitalApp",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hospital-6dfb6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hospital-6dfb6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hospital-6dfb6.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = getFirestore(app);

// Support Firestore Emulator if specified in environment
if (import.meta.env.VITE_FIRESTORE_EMULATOR_HOST) {
  const [host, port] = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host || '127.0.0.1', parseInt(port, 10) || 8080);
  console.log(`🔥 Client connected to Firestore Emulator at ${import.meta.env.VITE_FIRESTORE_EMULATOR_HOST}`);
}

export { app, db };
export default db;
