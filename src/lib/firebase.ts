import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug: Log configuration (without sensitive data)
console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyPresent: !!firebaseConfig.apiKey,
  appIdPresent: !!firebaseConfig.appId
});

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  throw error;
}

// Initialize Firestore
export const db = (() => {
  try {
    const firestore = getFirestore(app);
    console.log('Firestore initialized successfully');
    return firestore;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error;
  }
})();

// Initialize Auth
export const auth = (() => {
  try {
    const firebaseAuth = getAuth(app);
    console.log('Firebase Auth initialized successfully');
    return firebaseAuth;
  } catch (error) {
    console.error('Error initializing Firebase Auth:', error);
    throw error;
  }
})();