import { initializeApp } from 'firebase/app';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const useStorageEmulator = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR === 'true';

const firebaseConfig = useStorageEmulator ? {
  apiKey: 'demo-api-key',
  authDomain: 'demo-sistema-operaciones-qa.firebaseapp.com',
  projectId: 'demo-sistema-operaciones-qa',
  storageBucket: 'demo-sistema-operaciones-qa.firebasestorage.app',
  appId: 'demo-sistema-operaciones-qa',
} : {
  apiKey: "AIzaSyDGBBlUKP8fmxJRRpO3lOTXp3Kz-XIHzH0",
  authDomain: "sistema-de-operaciones.firebaseapp.com",
  projectId: "sistema-de-operaciones",
  storageBucket: "sistema-de-operaciones.firebasestorage.app",
  messagingSenderId: "698626770080",
  appId: "1:698626770080:web:d7baa05efee79f7f77b5c5",
  measurementId: "G-7B2BDP1Z89"
};

const firebaseApp = initializeApp(firebaseConfig);

export const firebaseStorage = getStorage(firebaseApp);

if (useStorageEmulator) {
  connectStorageEmulator(firebaseStorage, '127.0.0.1', 9199);
}
